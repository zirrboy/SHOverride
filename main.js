// Helper stuff
const nextChapterURL = /(?<=\[->\]" href=")[^"]+?(?:\/(\d+)\/)?(?=")/,
    pageTitle = /(?<=<title>).+?(?=<\/title>)/s,
    paginationCode = /(\$\(.#pag.*?)\}\);\s+<\/script>/s,
    leadingDigit = /\b\d/g,
    appendAnchor = $(".wi_footer")[0],
    initialId = $("#mypostid").attr("value"),
    style = $(document.head).append("<style></style>").children().last()[0];

function createMouseListener() {
    return function (_) {
        if (!inserting) {
            currentId = this;
        }
    }.bind(currentId);
}
function setBorderless(value) {
    borderless = value;
    q(".wi_fic_wrap, .wi-main, .wi_fic_comment").forEach((e) => {
        e.style = borderless ? "max-width:unset; padding: 0;" : "";
    });
    q(".wi_breadcrumb").forEach((e) => {
        e.style = borderless ? "max-width:unset;" : "";
    });
}
function updateStyle() {
    style.innerHTML = `.wi_fic_wrap, .wi-main, .wi_fic_comment {
        ${borderless ? "max-width:unset !important; padding: 0 !important;" : ""}
    }
    .wi_breadcrumb {
        ${borderless ? "max-width:unset !important;" : ""}
    }
    #chp_raw p, #chp_raw span {
        font-family: "${font}", "Open Sans",sans-serif !important;
        color: ${colorText} !important;
    }
    #main\\20 read\\20 chapter.site-main {
        background-color: ${colorPage} !important;
    }
    input[type="color"] {
        padding: 0 !important;
        width: 23px !important;
    }
    `;
}
function comment(event) {
    event.preventDefault();
    const data = {};
    new FormData(this).forEach((value, key) => (data[key] = value));
    $.ajax({
        type: "POST",
        url: this.action,
        data,
    });
}
var inserting = false,
    nextURL = $(".btn-next").attr("href"),
    nextId = nextURL.slice(nextURL.lastIndexOf("/", nextURL.length - 2) + 1, -1),
    currentId = initialId,
    borderless = false,
    font = "",
    colorText="",
    colorPage=""
    pages = 1;
$("#page").attr("postid", currentId)[0].onmousemove = createMouseListener();

// Injects for multipage compatability
const q = document.querySelectorAll.bind(document);
document.querySelectorAll = function (a) {
    a = a.replaceAll(leadingDigit, "\\3$& ");
    const r = q(`[postid="${currentId}"] ` + a);
    if (r.length) {
        return r;
    } else {
        return q(a);
    }
};
document.getElementById = (a) => document.querySelectorAll("#" + a)[0];
document.getElementsByClassName = (a) => document.querySelectorAll("." + a);
document.getElementsByName = (a) => document.querySelectorAll(`[name=${a}]`);
document.getElementsByTagName = document.querySelectorAll;
const _setItem = setItem;
setItem = function () {
    _setItem();
    intG_Y -= document.querySelectorAll("")[0].offsetTop - 50;
};
const _reset_rs_all = reset_rs_all
reset_rs_all = function () {
    _reset_rs_all();
    borderless = false
    font = ""
    colorPage = ""
    colorText = ""
    updateStyle();
}
alterPage();
updateStyle();

// Load and paste
window.onscroll = function (_) {
    const distBottom =
        document.body.clientHeight - window.innerHeight - window.pageYOffset;
    if (distBottom < 1000 && !inserting && nextURL != "#") {
        inserting = true;
        $.ajax({
            type: "GET",
            url: nextURL,
            success: insertChapter,
        });
    }
};
function insertChapter(raw) {
    updateURL(raw);
    const fragment = loadContent(raw);
    fragment.firstChild.onmousemove = createMouseListener();
    document.body.insertBefore(fragment, appendAnchor);
    rerunScripts(raw);
    alterPage();
    if (++pages > 3) {
        q("#page")[0].remove();
    }
    inserting = false;
}
function updateURL(raw) {
    const next = nextChapterURL.exec(raw);
    window.history.pushState({}, "", nextURL);
    q("title")[0].innerText = pageTitle.exec(raw)[0];
    nextURL = next[0];
    currentId = nextId;
    nextId = next[1];
}
function loadContent(raw) {
    const fragment = document.createDocumentFragment();
    $(fragment).append(getPage(raw));
    $(fragment.firstChild).attr("postid", currentId);
    return fragment;
}
function getPage(source) {
    const start = source.indexOf('<div id="page"'),
        end = source.indexOf("<!-- #page", start);
    return source.slice(start, end);
}
function rerunScripts(raw) {
    eval(paginationCode.exec(raw)[1]);
    in_comment_start();
    enable_jsmenu();
    $("#p_rs_box").remove();
}
function alterPage() {
    $("#comments")
        .attr("style", "max-height: 70px; overflow: hidden;")
        .attr("title", "Click to expand")
        .attr(
            "onclick",
            "$(this).prop('onclick', null).removeAttr('style title onclick');"
        );
    $("#commentform").submit(comment);
    $(".s_novel_img, .nav_chp_fi, .next_nav_links").remove();
    $(
        `<div onclick="event.stopPropagation()">
            <label class="chp_setting_title">Borderless 
                <input ${borderless? "checked" : "" } type="checkbox" onclick="borderless = this.checked; updateStyle();">
            </label>
            <div class="chp_setting_title">
                <label>Font <input value="${font}" oninput="font = this.value; updateStyle();"></label>
            </div>
            <div class="chp_setting_title">
                <label>Text Color <input type="color" value="${colorText}" oninput="colorText = this.value; updateStyle();"></label>
            </div>
            <div class="chp_setting_title">
                <label>Page Color <input type="color" value="${colorPage}" oninput="colorPage = this.value; updateStyle();"></label>
            </div>
        </div>`
    ).insertBefore(".cs_body>div:last");
}
