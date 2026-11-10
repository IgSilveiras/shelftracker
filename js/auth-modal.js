import { closeModalAnimated } from "./utils.js";
import { t, onLanguageChange } from "./translations.js";
import { login, register, logout, sendPasswordReset, resendVerification, refreshVerification, authErrorKey } from "./auth.js";
import { startSession, getSessionUser, getSessionProfile, refreshProfile, emitSession } from "./session.js";
import { HANDLE_PATTERN, isHandleAvailable, createProfile, renameProfile, setProfilePublic, profileErrorKey } from "./profile-service.js";

const MIN_PASSWORD = 6;
const RESEND_COOLDOWN_MS = 30_000;
const VERIFY_POLL_MS = 4000;

const FORM_VIEWS = {
    login:      { title: "auth.loginTitle",     submit: "auth.loginSubmit",     switchTo: "register",   switchLabel: "auth.toRegister",     password: true,  forgot: true,  autocomplete: "current-password"},
    register:   { title: "auth.registerTitle",  submit: "auth.registerSubmit",  switchTo: "login",      switchLabel: "auth.toLogin",        password: true,  forgot: false, autocomplete: "new-password"},
    reset:      { title: "auth.resetTitle",     submit: "auth.resetSubmit",     switchTo: "login",      switchLabel: "auth.toLogin",        password: false, forgot: false, autocomplete: "off"},
};

export function initAuthModal({ getLocalCount, onImportLocal, onGoToShelf= () => {}, onClosed = () => {} }) {
    const modal = document.querySelector("#authModal");
    const title = document.querySelector("#authModalTitle");
    const message = document.querySelector("#authMessage");
    
    const form = document.querySelector("#authForm");
    const emailInput = document.querySelector("#authEmail");
    const passwordGroup = document.querySelector("#authPasswordGroup");
    const passwordInput = document.querySelector("#authPassword");
    const submitBtn = document.querySelector("#authSubmitBtn");
    const switchBtn = document.querySelector("#authSwitchBtn");
    const forgotBtn = document.querySelector("#authForgotBtn");

    const verifyView = document.querySelector("#authVerifyView");
    const verifyText = document.querySelector("#authVerifyText");
    const verifiedBtn = document.querySelector("#authVerifiedBtn");
    const resendBtn = document.querySelector("#authResendBtn");

    const accountView = document.querySelector("#authAccountView");
    const accountEmail = document.querySelector("#authAccountEmail");
    const accountStatus = document.querySelector("#authAccountStatus");
    const accountVerifyBtn = document.querySelector("#authAccountVerifyBtn");
    const logoutBtn = document.querySelector("#authLogoutBtn");
    const deleteHint = document.querySelector("#authDeleteHint");

    const setupForm = document.querySelector("#authSetupForm");
    const usernameInput = document.querySelector("#authUsername");
    const setupSubmitBtn = document.querySelector("#authSetupSubmitBtn");

    const publicRow = document.querySelector("#authPublicRow");
    const publicToggle = document.querySelector("#authPublicToggle");

    const renameForm = document.querySelector("#authRenameForm");
    const renameInput = document.querySelector("#authRenameInput");
    const renameSubmitBtn = document.querySelector("#authRenameSubmitBtn");
    const renameCancelBtn = document.querySelector("#authRenameCancelBtn");
    const renameBtn = document.querySelector("#authRenameBtn");

    const importView = document.querySelector("#authImportView");
    const importDelete = document.querySelector("#authImportDelete");
    const importYesBtn = document.querySelector("#authImportYesBtn");
    const importNoBtn = document.querySelector("#authImportNoBtn");

    let view = "login";
    let busy = false;
    let pendingEmail = "";

    const close = () => closeModalAnimated(modal);

    function finishSetup() {
        close();
        onGoToShelf();
    }

    function setMessage(text = "", kind = "info") {
        message.textContent = text;
        message.dataset.kind = kind;
        message.setAttribute("role", kind === "error" ? "alert" : "status");
    }

    function setBusy(value) {
        busy = value;
        for (const btn of [submitBtn, setupSubmitBtn, importYesBtn, importDelete, renameSubmitBtn]) {
            btn.disabled = value;
            btn.setAttribute("aria-busy", value);
        }
    }

    function render() {
        const isForm = view in FORM_VIEWS;
        form.hidden = !isForm;
        setupForm.hidden = view !== "setup";
        verifyView.hidden = view !== "verify";
        accountView.hidden = view !== "account";
        importView.hidden = view !== "import";
        renameForm.hidden = view !== "rename";

        if (isForm) {
            const cfg = FORM_VIEWS[view];
            title.textContent = t(cfg.title);
            submitBtn.textContent = t(cfg.submit);
            switchBtn.textContent = t(cfg.switchLabel);
            passwordGroup.hidden = !cfg.password;
            passwordInput.autocomplete = cfg.autocomplete;
            forgotBtn.hidden = !cfg.forgot;
        }

        else if (view === "verify") {
            title.textContent = t("auth.verifyTitle");
            verifyText.textContent = t("auth.verifyText", { email: pendingEmail });
        }

        else if (view === "setup") {
            title.textContent = t("profile.setupTitle");
        }

        else if (view === "import") {
            title.textContent = t("auth.importTitle");
        }

        else if (view === "rename") {
            title.textContent = t("profile.renameTitle");
        }

        else {
            const user = getSessionUser();
            title.textContent = t("account.title");
            accountEmail.textContent = [getSessionProfile()?.username, user?.email].filter(Boolean).join(" · ")
            accountStatus.textContent = t(user?.emailVerified ? "account.verified" : "account.notVerified");
            accountVerifyBtn.hidden = !user || user.emailVerified;
            deleteHint.textContent = t("account.deleteHint");

            const profile = getSessionProfile();
            publicRow.hidden = !profile;
            renameBtn.hidden = !profile;
            if (profile) publicToggle.checked = profile.isPublic === true;
        }
    }
    
    function show(nextView) {
        view = nextView;
        importDelete.checked = false;
        stopPolling();
        if (nextView === "verify") startPolling();
        setMessage();
        render();
    }

    let pollTimer = null;
    let checking = false;
    
    const stopPolling = () => { clearInterval(pollTimer); pollTimer = null; };

    function startPolling() {
        stopPolling();
        pollTimer = setInterval(() => { if (!document.hidden) checkVerified({ silent: true}); }, VERIFY_POLL_MS)
    }

    async function finishAuth(user = getSessionUser()) {
        const profile = await refreshProfile(user);
        if (profile) { close(); onGoToShelf(); }
        else show("setup");
    }

    async function checkVerified({ silent }) {
        if (checking) return;
        checking = true;

        try {
            if (!(await refreshVerification())) {
                if (!silent) setMessage(t("auth.notVerifiedYet"), "error");
                return;
            }

            stopPolling();
            emitSession();
            await finishAuth();
        }

        catch (err) {
            if (!silent) setMessage(t(authErrorKey(err)), "error");
        }

        finally {
            checking = false;
        }
    }

    function defaultView() {
        const user = getSessionUser();
        if (!user) return "login";
        if (user.emailVerified && getSessionProfile() === null) return "setup";
        return "account";
    }

    document.addEventListener("visibilitychange", () => {
        if (!document.hidden && modal.open && view === "verify") checkVerified({ silent: true });
    })

    onLanguageChange(render);

    // --- Login / Register / Recover ---
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (busy) return;

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !emailInput.validity.valid) return setMessage(t("auth.errorInvalidEmail"), "error");
        if (view === "register" && password.length < MIN_PASSWORD) return setMessage(t("auth.errorWeakPassword"), "error");

        setBusy(true);
        setMessage();

        try {
            if (view === "login") {
                const user = await login(email, password);

                if (user.emailVerified) await finishAuth(user);
                else { pendingEmail = user.email; show("verify"); }
            }

            else if (view === "register") {
                const { verificationSent } = await register(email, password);
                pendingEmail = email;
                show("verify");
                setMessage(t(verificationSent ? "auth.verifySent" : "auth.verifySendFailed"), verificationSent ? "info" : "error");
            }

            else {
                await sendPasswordReset(email);
                setMessage(t("auth.resetSent"));
            }
        }

        catch (err) {
            setMessage(t(authErrorKey(err)), "error");
        }

        finally {
            setBusy(false);
        }
    });

    switchBtn.addEventListener("click", () => show(FORM_VIEWS[view].switchTo));
    forgotBtn.addEventListener("click", () => show("reset"));


    // --- Mail verification ---
    verifiedBtn.addEventListener("click", async () => {
        verifiedBtn.disabled = true;
        setMessage();
        await checkVerified({ silent: false });
        verifiedBtn.disabled = false;
    });

    resendBtn.addEventListener("click", async () => {
        resendBtn.disabled = true;

        try {
            await resendVerification();
            setMessage(t("auth.verifySent"));
        }

        catch (err) {
            setMessage(t(authErrorKey(err)), "error");
        }

        setTimeout(() => { resendBtn.disabled = false; }, RESEND_COOLDOWN_MS);
    });

    // --- Account ---
    accountVerifyBtn.addEventListener("click", () => {
        pendingEmail = getSessionUser()?.email ?? "";
        show("verify");
    });

    logoutBtn.addEventListener("click", async () => {
        try {
            await logout();
            close();
        }

        catch (err) {
            setMessage(t(authErrorKey(err)), "error");
        }
    });

    setupForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (busy) return;

        const username = usernameInput.value.trim();
        const user = getSessionUser();
        if (!user) return;

        if (!HANDLE_PATTERN.test(username)) return setMessage(t("profile.errorFormat"), "error");

        setBusy(true);
        setMessage();

        try {
            if (!(await isHandleAvailable(username))) return setMessage(t("profile.errorTaken"), "error");

            await createProfile(user.uid, username);
            await refreshProfile(user);
            if (getLocalCount() > 0) show("import");
            else finishSetup();
        }

        catch (err) {
            setMessage(t(profileErrorKey(err)), "error");
        }

        finally {
            setBusy(false);
        }
    });

    publicToggle.addEventListener("change", async () => {
        const user = getSessionUser();
        if (!user) return;

        const wanted = publicToggle.checked;
        publicToggle.disabled = true;
        setMessage();

        try {
            await setProfilePublic(user.uid, wanted);
            await refreshProfile(user);
            render();
        }

        catch (err) {
            console.error("Couldn't update privacy:", err);
            publicToggle.checked = !wanted;
        }

        finally {
            publicToggle.disabled = false;
        }
    })

    renameBtn.addEventListener("click", () => {
        show("rename");
        renameInput.value = getSessionProfile()?.username ?? "";
        renameInput.focus();
        renameInput.select();
    });

    renameCancelBtn.addEventListener("click", () => show("account"));

    renameForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (busy) return;

        const user = getSessionUser();
        const current = getSessionProfile()?.username;
        const next = renameInput.value.trim();
        if (!user || !current) return;

        if (!HANDLE_PATTERN.test(next)) return setMessage(t("profile.errorFormat"), "error");
        if (next === current) return show("account");

        setBusy(true);
        setMessage();

        try {
            const sameHandle = next.toLowerCase() === current.toLowerCase();
            if (!sameHandle && !(await isHandleAvailable(next))) {
                return setMessage(t("profile.errorTaken"), "error");
            }

            await renameProfile(user.uid, current, next);
            await refreshProfile(user);
            close();
            onGoToShelf();
        }

        catch (err) {
            setMessage(t(profileErrorKey(err)), "error");
        }

        finally {
            setBusy(false);
        }
    })

    importYesBtn.addEventListener("click", async () => {
        if (busy) return;
        setBusy(true);
        setMessage();

        try {
            await onImportLocal({ deleteLocal: importDelete.checked });
            finishSetup();
        }

        catch (err) {
            console.error("Couldn't import local list:", err);
            setMessage(t("auth.importError"), "error");
        }

        finally {
            setBusy(false);
        }
    });

    importNoBtn.addEventListener("click", finishSetup);


    // --- Modal closing ---
    modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
    modal.addEventListener("cancel", (e) => { e.preventDefault(); close(); });
    modal.addEventListener("close", () => {
        stopPolling();
        passwordInput.value = "";
        setMessage();
        onClosed();
    });

    return {
        isOpen: () => modal.open,
        open(startView) {
            startSession().catch(() => {});
            pendingEmail = getSessionUser()?.email ?? "";
            show(startView ?? defaultView());
            modal.showModal();
            if (!form.hidden) emailInput.focus();
            if (!setupForm.hidden) usernameInput.focus();
        },
    };
}