/**
 * Dynamic Security Watermark Component for Virtual Science Labs
 * Renders an ultra-subtle, elegant watermark displaying user identity to prevent unauthorized screen recording.
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
        z-index: 999999;
        overflow: hidden;
        display: flex;
        flex-wrap: wrap;
        justify-content: space-around;
        align-content: space-around;
        opacity: 0.05;
        user-select: none;
    `;

    // Create subtle, spacious tiled watermark tags
    for (let i = 0; i < 6; i++) {
        const item = document.createElement("div");
        item.style.cssText = `
            transform: rotate(-20deg);
            font-family: 'Cairo', sans-serif;
            font-weight: 700;
            font-size: 0.85rem;
            color: #475569;
            margin: 80px 50px;
            white-space: nowrap;
            letter-spacing: 0.5px;
        `;
        item.innerHTML = `<i class="fas fa-user-shield"></i> ${escapeHtml(userName)} ${userContact ? ' | ' + escapeHtml(userContact) : ''}`;
        overlay.appendChild(item);
    }

    document.body.appendChild(overlay);

    function escapeHtml(str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
});
