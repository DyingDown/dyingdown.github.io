/*********show menu in phone or else device *******/
var menuIcon = document.getElementsByClassName("menu-icon")[0]
var menuClickFlag = 0;
var menuOuter = document.getElementById("menu-outer");

/****** add or remove a class  *************/
function modifyClass(obj, className, op) { // op = 1 add; op == 0 remove
    if (op == 1) {
        obj.classList.add(className);
    } else {
        if (obj.classList.contains(className)) {
            obj.classList.remove(className);
        }
    }
}

/******* insert After **********/
function insertAfter(newElement, targetElement) { // newElement是要追加的元素 targetElement 是指定元素的位置 
    var parent = targetElement.parentNode; // 找到指定元素的父节点 
    if (parent.lastChild == targetElement) { // 判断指定元素的是否是节点中的最后一个位置 如果是的话就直接使用appendChild方法 
        parent.appendChild(newElement, targetElement);
    } else {
        parent.insertBefore(newElement, targetElement.nextSibling);
    };
};


/******* drawer header close and open function *********/
menuIcon.onclick = function() {
    var first = this.childNodes[0];
    var second = this.childNodes[1];
    var third = this.childNodes[2];
    var nav = document.getElementById("nav");
    if (menuClickFlag == 0) {
        modifyClass(second, "newSecondLine", 1);
        modifyClass(first, "newFirstLine", 1);
        modifyClass(third, "newThirdLine", 1);
        modifyClass(nav, "newNav", 1);
        modifyClass(menuOuter, "newMenuOuter", 1);
        menuClickFlag = 1;
    } else {
        modifyClass(second, "newSecondLine", 0);
        modifyClass(first, "newFirstLine", 0);
        modifyClass(third, "newThirdLine", 0);
        modifyClass(nav, "newNav", 0);
        menuClickFlag = 0;
        modifyClass(menuOuter, "newMenuOuter", 0);
    }

}

/******** change header transparency when scroll ********/
window.addEventListener("scroll", function() {
    if (isHome) {
        const scrollTop = window.scrollY; // 当前滚动高度
        const maxScroll = 400; // 滚动达到 300px 时完全不透明
        const headerOpacity = Math.min(scrollTop / maxScroll, 1); // 控制透明度范围从 0 到 1
        
        // 获取当前背景色
        const currentBgColor = window.getComputedStyle(menuOuter).backgroundColor;
        // 如果当前背景色是 rgba 或 rgb 形式
        if (currentBgColor.startsWith('rgb')) {
            const rgbValues = currentBgColor.match(/\d+/g); // 获取rgb中的数值数组
            // 设置新的背景色
            menuOuter.style.backgroundColor = `rgba(${rgbValues[0]}, ${rgbValues[1]}, ${rgbValues[2]}, ${headerOpacity})`;
        }
    }
});


/****** go to top button ******/
var backToTopButton = document.getElementById("back-to-top")
var toCommentButton = document.getElementById("go-to-comment")
if (backToTopButton != null) {
    backToTopButton.addEventListener("click", () => {
        document.body.scrollIntoView({
            behavior: "smooth",
        });
    })
}


var commentBox = document.getElementById("vcomment")
var menuA = document.getElementById("menu-outer")
if (toCommentButton != null && commentBox != null && menuA != null) {
    toCommentButton.addEventListener("click", () => {
        var height = 0;
        t = commentBox;
        do {
            height += t.offsetTop;
            t = t.offsetParent;
        }while(t != document.body)
        window.scrollTo({
            top: height - 80,
            behavior: "smooth",
        })
    })
}


/********* search *********/
searchInput = document.getElementById("local-search-input")
// searchInput.on
searchInput.onclick = function(){ 
    getSearchFile(); 
    this.onclick = null;
}
// searchInput.onkeydown = function(){ 
//     if(event.keyCode == 13) 
//         return false;
// }

/********** alert message ********/
const message = new Message();
