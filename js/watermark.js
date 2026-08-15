/**
 * Ultra-faint Background Security Watermark Component for Virtual Science Labs
 * Renders an almost imperceptible, background watermark behind page elements.
 */
document.addEventListener("DOMContentLoaded", function() {
    if (typeof window.WATERMARK_USER === "undefined") return;

    const userName = window.WATERMARK_USER.name || "معلم معتمد";
    const userContact = window.WATERMARK_USER.contact || "";

    const overlay = document.createElement("div");
    overlay.id = "security-watermark-overlay";
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 0;
        overflow: hidden;
        display: flex;
        flex-wrap: wrap;
        justify-content: space-around;
        align-content: space-around;
        opacity: 0.015;
        user-select: none;
        mix-blend-mode: multiply;
    `;

    // Create faint, background tiled watermark tags
    for (let i = 0; i < 4; i++) {
        const item = document.createElement("div");
        item.style.cssText = `
            transform: rotate(-15deg);
            font-family: 'Cairo', sans-serif;
            font-weight: 500;
            font-size: 0.75rem;
            color: #94a3b8;
            margin: 120px 80px;
            white-space: nowrap;
            letter-spacing: 0.5px;
        `;
        item.innerHTML = `<i class="fas fa-user-shield"></i> ${escapeHtml(userName)} ${userContact ? ' | ' + escapeHtml(userContact) : ''}`;
        overlay.appendChild(item);
    }

    document.body.insertBefore(overlay, document.body.firstChild);

    function escapeHtml(str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
});
