var MEUtil = MEUtil || {};

/*---------- Public Properties ----------*/
MEUtil.vendorPrefix = {};

MEUtil.IS_TOUCH_DEVICE = (function (userAgent) {
    if (userAgent.match(/Android/i) ||
        userAgent.match(/webOS/i) ||
        userAgent.match(/iPhone/i) ||
        userAgent.match(/iPad/i) ||
        userAgent.match(/iPod/i) ||
        userAgent.match(/BlackBerry/) ||
        userAgent.match(/Windows Phone/i) ||
        userAgent.match(/ZuneWP7/i)) {
        return true;
    }
    else { return false; }
})(navigator.userAgent);

//do some extra touch device checks
if (!MEUtil.IS_TOUCH_DEVICE) {
    MEUtil.IS_TOUCH_DEVICE = ('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (navigator.msMaxTouchPoints > 0);
}

MEUtil.PIXEL_RATIO = (function () {
    var ctx = document.createElement("canvas").getContext("2d"),
        dpr = window.devicePixelRatio || 1,
        bsr = ctx.webkitBackingStorePixelRatio ||
            ctx.mozBackingStorePixelRatio ||
            ctx.msBackingStorePixelRatio ||
            ctx.oBackingStorePixelRatio ||
            ctx.backingStorePixelRatio || 1;

    return dpr / bsr;
})();

MEUtil.PREFIXES = ["webkit", "moz", "o", "ms"];

/*---------- Public Methods ----------*/
MEUtil.addClass = function (elm, className) {
    elm.className += " " + className;
};

MEUtil.removeClass = function (elm, className) {
    elm.className = elm.className.replace(
        new RegExp("(?:^|\s)" + className + "(?!\S)", "g"), '');
};

MEUtil.hasClass = function (elm, className) {
    return elm.className.match(new RegExp("(?:^|\s)" + className + "(?!\S)"));
};

MEUtil.appendChildren = function (parent, children) {
    if (parent.substring) { parent = document.getElementById(parent); }
    for (var i = 0, l = children.length; i < l; i++) {
        parent.appendChild(children[i]);
    }
};

MEUtil.createCanvas = function (width, height) {
    var can = document.createElement("canvas");
    can.width = width;
    can.height = height;
    return can;
};

MEUtil.createHiDPICanvas = function (w, h, ratio) {
    if (!ratio) { ratio = MEUtil.PIXEL_RATIO; }
    var can = document.createElement("canvas");
    can.width = w * ratio;
    can.height = h * ratio;
    can.style.width = w + "px";
    can.style.height = h + "px";
    can.getContext("2d").setTransform(ratio, 0, 0, ratio, 0, 0);
    return can;
};

MEUtil.getGlobalX = function (o) {
    var x = 0;
    do { x += o.offsetLeft; } while (o = o.offsetParent);
    return x;
};

MEUtil.getGlobalY = function (o) {
    var y = 0;
    do { y += o.offsetTop; } while (o = o.offsetParent);
    return y;
};

MEUtil.makeSuper = function (Man, SuperMan) {
    function F() { }
    F.prototype = SuperMan.prototype;

    var prototype = new F();
    prototype.constructor = Man;
    Man.prototype = prototype;
};

MEUtil.on = function (element, types, callback) {
    var typesArr = types.split(" ");
    for (var i = 0, l = typesArr.length; i < l; i++) {
        element.addEventListener(typesArr[i], callback, false);
    }
};

MEUtil.off = function (element, types, callback) {
    var typesArr = types.split(" ");
    for (var i = 0, l = typesArr.length; i < l; i++) {
        element.removeEventListener(typesArr[i], callback, false);
    }
};

MEUtil.upscaleCanvas = function (can, ratio) {
    if (can.substring) { can = document.getElementById(can); }
    if (!ratio) { ratio = MEUtil.PIXEL_RATIO; }
    var w = can.clientWidth || can.width,
        h = can.clientHeight || can.height,
        ctx = can.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    can.width = w * ratio;
    can.height = h * ratio;
    can.style.width = w + "px";
    can.style.height = h + "px";
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    return can;
};

MEUtil.loadFromDataSrc = function (assets, options) {
    var count = assets.length;

    for (var i = 0, l = count; i < l; i++) {
        var item = assets[i];
        if (typeof item != "string") {
            loadAssetFromDataSrc(item);
        } else {
            loadAssetFromPath(item);
        }
    }

    function loadAssetFromDataSrc(asset) {
        var path = asset.getAttribute("data-src");

        asset.removeAttribute("data-src");

        var img = new Image();
        img.onload = getImgLoadedFunction(asset);
        img.src = path;
    }

    function loadAssetFromPath(path) {
        //var img = new Image();
        //img.onload = getImgLoadedFunction();
        //img.src = path;

        var xmlReq = new XMLHttpRequest();

        xmlReq.onreadystatechange = function () {
            if (xmlReq.readyState == 4 && xmlReq.status == 200) {
                //getImgLoadedFunction returns a function.
                //we then call that function with second set of ()
                getImgLoadedFunction()();
            }
        }
        xmlReq.open('GET', path, true);
        xmlReq.send();
    }

    function getImgLoadedFunction(el) {
        return function () {
            count--;

            // Re-attach the loaded asset, if available.
            if (el) {
                switch (el.tagName.toLowerCase()) {
                    case "img":
                        el.src = this.src;
                        break;
                    case "div":
                        el.style.backgroundImage = "url(" + this.src + ")";
                        break;
                    case "object":
                        el.data = this.src;
                        break;
                    case "canvas":
                        // var ctx = el.getContext("2d");
                        // ctx.drawImage(this, 0, 0);
                        el.style.backgroundImage = "url(" + this.src + ")";
                }
            }

            // Update loading events, if available.
            if (options) {
                if (options.onProgress) {
                    options.onProgress({
                        type: "progress",
                        response: el,
                        progress: 1 - count / l
                    });
                }

                if (!count && options.onComplete) {
                    options.onComplete({
                        type: "complete",
                        response: assets
                    });
                }
            }
        };
    }
};

MEUtil.ImageStackr = function (spriteContainer) {
    var _animSpeed = 0,
        _animTime = 0,
        _canvas = null,
        _canvasCtx = null,
        _cols = 0,
        _currentFrame = 0,
        _frames = [],
        _imageCount = 0,
        _frameHeight = 0,
        _frameWidth = 0,
        _progressFlag = false,
        _spriteContainer = document.getElementById(spriteContainer),
        _spriteId = spriteContainer,
        _sprites = null,
        _stackrCanvas = null,
        _stackrCanvasCtx = null,
        _stackrFrame = 0,

        //Public Methods
        getAnimationSpeed = function () {
            return _animSpeed;
        },

        getCanvas = function () {
            return _canvas;
        },

        getContext = function () {
            return _canvasCtx;
        },

        getCurrentFrame = function () {
            return _currentFrame;
        },

        getElement = function () {
            return _spriteContainer;
        },

        getFrame = function () {
            return _currentFrame;
        },

        getId = function () {
            return _spriteId;
        },

        //In place for use with TweenLite.
        getProgress = function () {
            return ((_currentFrame - 1) / (_imageCount - 1));
        },

        gotoFrame = function (newFrame) {
            newFrame = (newFrame + 0.5) >> 0;
            if (newFrame != _currentFrame) {
                if (newFrame >= 1 && newFrame <= _imageCount) {
                    var canvasWidth = _canvas.width,
                        canvasHeight = _canvas.height,
                        frame = _frames[newFrame - 1];

                    _currentFrame = newFrame;
                    _canvasCtx.clearRect(0, 0, canvasWidth, canvasHeight);
                    _canvasCtx.drawImage(_sprites[frame.spriteIndex],
                        frame.x, frame.y, _frameWidth, _frameHeight,
                        0, 0, canvasWidth, canvasHeight);
                    _stackrCanvas.style.opacity = 0;
                }
            }
        },

        //loadSpriteSheet: passing your spritesheets into this method will
        //  generate a sprite in your imagestackr object with animation controls.
        //  The first two params are mandatory.
        //img: may be a single instance or an array of img elements (Image()) if
        //  your sprite requires multiple spritesheets.
        //count: the amount of frames - variable may be a number or array of numbers
        //  if you are also passing an array of images in the first parameter.
        //width/height: optional parameters, use if you do net set in css.
        //initFrame: use if the initial image of your spritesheet(s) is not the initial
        //  frame of your sprite.
        loadSpriteSheet = function (img, count, width, height, initFrame) {
            var i = 0,
                hasMultipleSprites, hasMultipleCounts;

            if (width === undefined) {
                width = $(_spriteContainer).width();
                height = $(_spriteContainer).height();
            }
            if (initFrame === undefined) initFrame = 1;

            _frames = [];
            _imageCount = 0;
            _sprites = null;
            try {
                var w = img[0].width;
                hasMultipleSprites = true;
                try {
                    var countIsArray = count[0];
                    for (i = 0; i < count.length; i++) {
                        _imageCount += count[i];
                    }
                    hasMultipleCounts = true;
                } catch (e) {
                    _imageCount = count;
                    hasMultipleCounts = false
                }
            } catch (e) {
                _imageCount = count;
                hasMultipleSprites = false;
            }

            //Remove items if method was used previously.
            if (_canvas !== null) {
                $(_canvas).remove();
                $(_stackrCanvas).remove();
            }

            _canvas = document.createElement("canvas");
            _stackrCanvas = document.createElement("canvas");
            _sprites = bufferCanvas(img, hasMultipleSprites);

            _frameWidth = _canvas.width = _stackrCanvas.width = width;
            _frameHeight = _canvas.height = _stackrCanvas.height = height;
            _canvas.style.width = _stackrCanvas.style.width =
                _spriteContainer.clientWidth ? _spriteContainer.clientWidth + "px" :
                    _frameWidth + "px";
            _canvas.style.height = _stackrCanvas.style.height =
                _spriteContainer.clientHeight ? _spriteContainer.clientHeight + "px" :
                    _frameHeight + "px";

            _canvasCtx = _canvas.getContext("2d");
            _stackrCanvasCtx = _stackrCanvas.getContext("2d");

            //Setup _frames array
            var frame = {},
                tempFrames = [];
            if (hasMultipleSprites) {
                var numImgs = 0,
                    cols = 0;
                for (i = 0; i < img.length; i++) {
                    numImgs = (hasMultipleCounts) ? count[i] : count;
                    cols = (img[i].width / width) >> 0; //Truncate decimal.
                    for (var k = 0; k < numImgs; k++) {
                        frame = {};
                        frame.spriteIndex = i;
                        frame.x = (k % cols) * _frameWidth;
                        frame.y = ((k / cols) >> 0) * _frameHeight;
                        tempFrames.push(frame);
                    }
                }
            } else {
                cols = (img.width / _frameWidth) >> 0; //Truncate decimal.
                for (i = 0; i < count; i++) {
                    frame = {};
                    frame.spriteIndex = 0;
                    frame.x = (i % cols) * _frameWidth;
                    frame.y = ((i / cols) >> 0) * _frameHeight;
                    tempFrames.push(frame);
                }
            }

            if (initFrame === 1) {
                _frames = tempFrames;
            } else {
                for (i = initFrame - 1; i < tempFrames.length; i++) {
                    _frames.push(tempFrames[i]);
                }
                for (i = 0; i < initFrame - 1; i++) {
                    _frames.push(tempFrames[i]);
                }
            }

            $(_stackrCanvas).css({ "position": "absolute", "left": 0, "top": 0 });

            $("#" + _spriteId).append(_canvas, _stackrCanvas);

            gotoFrame(1);
        },

        //Animation frame methods are still in a beta state, use at your own risk
        nextAnimationFrame = function () {
            if (_animSpeed !== 0) {
                var currentTime = new Date().getTime(),
                    deltaTime = currentTime - _animTime,
                    imageInc = ((deltaTime / _animSpeed) + 0.5) >> 0,
                    newImgNum = _currentFrame + (imageInc < 6 ? imageInc : 5);

                if (_animSpeed <= deltaTime + 2) { //add about a 2ms margin for timer variances
                    _animTime = currentTime;
                    _currentFrame = newImgNum <= _imageCount ? newImgNum : newImgNum - _imageCount;
                    gotoFrame(_currentFrame);
                }
            } else {
                nextFrame();
            }
        },

        nextFrame = function () {
            gotoFrame(_currentFrame < _imageCount ? _currentFrame + 1 : 1);
        },

        previousAnimationFrame = function () {
            if (_animSpeed != 0) {
                var currentTime = new Date().getTime(),
                    deltaTime = currentTime - _animTime,
                    imageInc = ((deltaTime / _animSpeed) + 0.5) >> 0,
                    newImgNum = _currentFrame + (imageInc < 6 ? imageInc : 5);

                if (_animSpeed <= deltaTime + 2) { //add about a 2ms margin for timer variances
                    _animTime = currentTime;
                    _currentFrame = newImgNum > 0 ? newImgNum : newImgNum + _imageCount;
                    gotoFrame(_currentFrame);
                }
            } else {
                previousFrame();
            }
        },

        previousFrame = function () {
            gotoFrame(_currentFrame > 1 ? _currentFrame - 1 : _imageCount);
        },

        progress = function (val) {
            var newImgNum = (val * (_imageCount - 1)) >> 0,
                imageNum2 = (newImgNum === (_imageCount - 1)) ? newImgNum : newImgNum + 1,
                frame = _frames[newImgNum],
                stackrFrame = _frames[imageNum2],
                canvasWidth = _canvas.width,
                canvasHeight = _canvas.height,
                subProg = (val * (_imageCount - 1)) - newImgNum;

            if (_currentFrame !== newImgNum + 1 || _progressFlag === false) {
                _progressFlag = true;
                _currentFrame = newImgNum + 1;
                _canvasCtx.drawImage(_sprites[frame.spriteIndex],
                    frame.x, frame.y,
                    _frameWidth, _frameHeight,
                    0, 0, canvasWidth, canvasHeight);
                _stackrCanvasCtx.drawImage(_sprites[stackrFrame.spriteIndex],
                    stackrFrame.x, stackrFrame.y,
                    _frameWidth, _frameHeight,
                    0, 0, canvasWidth, canvasHeight);
            }
            _stackrCanvas.style.opacity = subProg;
        },

        //Animation speed accessors are tied to animationFrame methods, you should not
        //  be using these.
        setAnimationSpeed = function (val) {
            _animSpeed = val;
            _animTime = new Date().getTime();
        },

        setFrame = function (newFrame) {
            gotoFrame(newFrame);
        },

        setProgress = function (val) {
            progress(val);
        },

        setSize = function (width, height) {
            _canvas.style.width = _stackrCanvas.style.width = width + "px";
            _canvas.style.height = _stackrCanvas.style.height = height + "px";
            gotoFrame(_currentFrame);
        },

        //Private Methods
        bufferCanvas = function (img, isImgArray) {
            var canvasArray = [];
            if (isImgArray) {
                for (var i = 0; i < img.length; i++) {
                    var buffCanvas = document.createElement("canvas"),
                        buffCtx = buffCanvas.getContext("2d"),
                        w = img[i].width,
                        h = img[i].height;

                    buffCanvas.width = w;
                    buffCanvas.height = h;
                    buffCtx.drawImage(img[i], 0, 0);
                    canvasArray.push(buffCanvas);
                }
            } else {
                var buffCanvas = document.createElement("canvas"),
                    buffCtx = buffCanvas.getContext("2d"),
                    w = img.width,
                    h = img.height;

                buffCanvas.width = w;
                buffCanvas.height = h;
                buffCtx.drawImage(img, 0, 0);
                canvasArray.push(buffCanvas);
            }
            return canvasArray;
        };

    return {
        getAnimationSpeed: getAnimationSpeed,
        getCanvas: getCanvas,
        getContext: getContext,
        getCurrentFrame: getCurrentFrame,
        getElement: getElement,
        getFrame: getFrame,
        getId: getId,
        getProgress: getProgress,
        gotoFrame: gotoFrame,
        loadSpriteSheet: loadSpriteSheet,
        nextAnimationFrame: nextAnimationFrame,
        nextFrame: nextFrame,
        previousFrame: previousFrame,
        previousAnimationFrame: previousAnimationFrame,
        progress: progress,
        setAnimationSpeed: setAnimationSpeed,
        setFrame: setFrame,
        setProgress: setProgress,
        setSize: setSize
    };
};

MEUtil.raf = (function () {
    var requestAnimationFrame =
        window.requestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };

    return function (callback) {
        requestAnimationFrame(callback);
    };
})();

MEUtil.drawLine = function (ctx, arr, startColor, nextColor) {
    var sColor = startColor ? startColor : '#000000',
        nColor = nextColor ? nextColor : '#FFFFFF';

    ctx.strokeStyle = sColor;
    ctx.lineWidth = 2;

    for (var i = 0; i < arr.length - 2; i += 2) {
        ctx.strokeStyle = i % 4 == 0 ? sColor : nColor;
        ctx.beginPath();
        ctx.moveTo(arr[i], arr[i + 1]);
        ctx.lineTo(arr[i + 2], arr[i + 3]);
        ctx.stroke();
    }

};

MEUtil.setPrefixedEvent = function (el, evtType, callback) {
    var prefixes = MEUtil.PREFIXES;
    for (var i = 0, l = prefixes.length; i < l; i++) {
        el.addEventListener(prefixes[i] + evtType, callback, false);
    }
    el.addEventListener(evtType.toLowerCase(), callback, false);
};

MEUtil.removePrefixedEvent = function (el, evtType, callback) {
    var prefixes = MEUtil.PREFIXES;
    for (var i = 0, l = prefixes.length; i < l; i++) {
        el.removeEventListener(prefixes[i] + evtType, callback, false);
    }
    el.removeEventListener(evtType.toLowerCase(), callback, false);
};

MEUtil.getPrefixedProp = function (prop) {
    if (MEUtil.vendorPrefix[prop]) {
        return MEUtil.vendorPrefix[prop];
    } else {
        var prefixes = MEUtil.PREFIXES,
            el = document.createElement("div"),
            ref = MEUtil.vendorPrefix,
            lowProp = prop.charAt(0).toLowerCase() + prop.slice(1),
            highProp = prop.charAt(0).toUpperCase() + prop.slice(1);

        if (lowProp in el.style) {
            ref[prop] = lowProp;
        } else {
            var preProp = "";
            ref[prop] = null;
            for (var i = 0, l = prefixes.length; i < l; i++) {
                preProp = prefixes[i] + highProp;
                if (preProp in el.style) {
                    ref[prop] = preProp;
                    break;
                }
            }
        }

        MEUtil.vendorPrefix[prop] = ref[prop];
        return ref[prop];
    }
};

MEUtil.setRuleProperty = function (selector, prop, val) {
    var sheets = document.styleSheets,
        rules = null,
        ii = 0, l = 0;

    for (var i = sheets.length - 1; i > -1; i--) {
        rules = sheets[i].cssRules;
        l = rules.length;
        for (ii = 0; ii < l; ii++) {
            if (rules[ii].selectorText === selector) {
                rules[ii].style.setProperty(prop, val, null);
                i = -1;
                break;
            }
        }
    }
};

/*This custom event object is incredibly basic because
that is all it needs to be.  Normal Javascript Events 
have a lot of unnecessary information that does not apply
to our needs.*/
function NikEvent(type, target) {
    return {
        target: target,
        timeStamp: Date.now(),
        type: type
    };
}

function NikSplash(callback, imagePaths, option_) {
    if (!(this instanceof NikSplash)) {
        return new NikSplash(callback, imagePaths, option_);
    }

    var option = option_ || {};
    if (option.disable) {
        this.fadeOut = function () { };
        document.getElementsByClassName("mainscene")[0].style.visibility = "visible";

        // Compile all assets to load.
        var allAssets = [];
        (function () {
            var pathElements = document.querySelectorAll("[data-src]");
            for (var i = 0, l = pathElements.length; i < l; i++) {
                allAssets.push(pathElements[i]);
            }
            if (imagePaths) {
                l = imagePaths.length
                for (i = 0; i < l; i++) {
                    allAssets.push(imagePaths[i]);
                }
            }
        })();

        if (allAssets.length) {
            MEUtil.loadFromDataSrc(allAssets);
        }
        // Compile all assets to load.

        setTimeout(function () { callback(); }, 10);
        return;
    }

    var splashContainer = document.createElement("div"),
        loadContainer = document.createElement("div"),
        tut = document.getElementsByTagName("body")[0];



    splashContainer.className = "splashContainer";
    // splashContainer.style.width = tut.offsetWidth;
    // splashContainer.style.height = tut.offsetHeight;
    loadContainer.className = "splashBackground";

    splashContainer.appendChild(loadContainer);
    tut.appendChild(splashContainer);

    var loadText = document.createElement("div"),
        loadBarContainer = document.createElement("div"),
        loadBarFill = document.createElement("div");

    /*------- Set default options on the tutorial contaner --------*/
    var tapHighlight = MEUtil.getPrefixedProp("tapHighlightColor");
    tut.style[tapHighlight] = "rgba(0,0,0,0)";
    if (MEUtil.IS_TOUCH_DEVICE) {
        tut.addEventListener("touchmove", function (event) {
            if (event.type === "touchmove") {
                if (event.touches.length === 1) {
                    event.preventDefault();
                }
            }
        }, false);
    }

    init();

    return {
        fadeOut: fadeSplash
    };

    function init() {

        // - - - - - tutorial title - - - - - //
        (function () {
            // - - - - - build html - - - - - //
            var tutorialTitle = document.getElementsByClassName("tutorialTitle")[0];
            var titleStr = tutorialTitle.innerHTML;
            tutorialTitle.innerHTML = null;

            var canvas = document.createElement("canvas");
            canvas.className = "tutorialTitleCanvas";
            tutorialTitle.appendChild(canvas);

            var t = document.createElement("div");
            t.className = "tutorialTitleText";
            t.innerHTML = titleStr;
            tutorialTitle.appendChild(t);

            var titleWidth = Math.min(t.offsetWidth + 100, tut.offsetWidth - 40);

            t.style.width = titleWidth + "px";
            canvas.style.width = titleWidth + "px";
            canvas.style.height = (14 + t.offsetHeight) + "px";
            tutorialTitle.style.width = titleWidth + "px";
            tutorialTitle.style.left = (tut.offsetWidth / 2 - tutorialTitle.offsetWidth / 2) + "px";

            var ctx = MEUtil.upscaleCanvas(canvas).getContext("2d");
            // - - - - - build html - - - - - //

            var inset = 10,
                border_radius = 14,
                lineW = 2;

            ctx.strokeStyle = "#7C8F99";
            ctx.lineWidth = lineW;

            ctx.beginPath();
            ctx.moveTo(pxAdj(canvas.width), 0);
            ctx.arcTo(pxAdj(canvas.width) - inset, pxAdj(canvas.height) - lineW, pxAdj(canvas.width) / 2, pxAdj(canvas.height) - lineW, border_radius);
            ctx.arcTo(inset, pxAdj(canvas.height) - lineW, 0, 0, border_radius);
            ctx.lineTo(0, 0);

            ctx.save();
            ctx.clip();

            var grd = ctx.createLinearGradient(0, 0, 0, pxAdj(canvas.height));
            grd.addColorStop(0, "#AAB4B9");
            grd.addColorStop(1, "#D9DFE1");
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, pxAdj(canvas.width), pxAdj(canvas.height));

            grd = ctx.createRadialGradient(pxAdj(canvas.width) / 2, -10, 0, pxAdj(canvas.width) / 2, -pxAdj(canvas.width) / 3, pxAdj(canvas.width) / 1.5);
            grd.addColorStop(0, "rgba(255, 255, 255, 1)");
            grd.addColorStop(1, "rgba(255, 255, 255, 0)");
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, pxAdj(canvas.width), pxAdj(canvas.height));

            ctx.restore();
            ctx.stroke();

            function pxAdj(widthOrHeight) {
                return widthOrHeight / MEUtil.PIXEL_RATIO;
            }

        })();

        (function () {
            var ctx, canvas;
            var alpha = 1;
            var img = new Image();
            img.onload = function () {
                buildHTML();
                animate(alpha);
            }
            img.src = "./images/nikonLogoAll.png";

            function animate(alpha) {
                ctx.clearRect(0, 0, pxAdj(canvas.width), pxAdj(canvas.height));
                drawGradient(alpha);
                changeGCP();
                drawLogoImg(img);

                alpha -= 1 / 30;
                if (alpha > 0.0001) {
                    MEUtil.raf(function () {
                        animate(alpha);
                    });
                }
            }

            function buildHTML() {
                //build html
                canvas = document.createElement("canvas");
                canvas.className = "tutorialCanvas";
                canvas = (function (can, ratio) {
                    if (can.substring) { can = document.getElementById(can); }
                    if (!ratio) { ratio = MEUtil.PIXEL_RATIO; }
                    var borderVal = getComputedStyle(splashContainer, null).getPropertyValue('border-left-width');
                    borderVal = borderVal.substring(0, borderVal.length - 2) * 2;
                    var w = splashContainer.offsetWidth - borderVal,
                        h = splashContainer.offsetHeight - borderVal,
                        ctx = can.getContext("2d");
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                    can.width = w * ratio;
                    can.height = h * ratio;
                    can.style.width = w + "px";
                    can.style.height = h + "px";
                    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
                    return can;
                })(canvas);
                ctx = canvas.getContext("2d");
                // ctx = MEUtil.upscaleCanvas(canvas).getContext("2d");
                splashContainer.appendChild(canvas);
                //---------
            }

            function drawGradient(alpha) {
                //draw gradient
                var grd = ctx.createLinearGradient(0, 0, 0, pxAdj(canvas.height));
                grd.addColorStop(0.5, "rgba(255, 255, 255, " + alpha + ")");
                grd.addColorStop(1, "rgba(255, 255, 255, 0)");
                ctx.fillStyle = grd;
                ctx.fillRect(0, 0, pxAdj(canvas.width), pxAdj(canvas.height));
                //---------
            }

            function changeGCP() {
                //change GCP
                ctx.globalCompositeOperation = "lighter";
                //---------
            }

            function drawLogoImg(img, yPad) {
                //draw logo img
                var convertedWidth = img.width;
                var convertedHeight = img.height;
                var convertedCanWidth = canvas.width / MEUtil.PIXEL_RATIO;

                if (convertedCanWidth < img.width) {
                    convertedWidth = Math.round(convertedCanWidth * 0.9);
                    convertedHeight = Math.round(img.height * convertedWidth / img.width);
                }

                var x = (pxAdj(canvas.width) - convertedWidth) / 2,
                    y = (pxAdj(canvas.height) - convertedHeight) / 2;

                ctx.drawImage(img, x, y + (yPad || 0), convertedWidth, convertedHeight);
                //---------
            }

            function pxAdj(widthOrHeight) {
                return widthOrHeight / MEUtil.PIXEL_RATIO;
            }

        })();

        var loadBarGloss = document.createElement("div"),
            loadBar = document.createElement("div"),
            loadBarSkin = document.createElement("div"),
            logoImg = document.createElement("img"),
            microLogoImg = document.createElement("img"),
            nikonLogoImg = document.createElement("img"),
            logoTxt = document.createElement("div");

        loadBarContainer.className = "loadBarContainer";
        loadBarFill.className = "loadBarFill";

        loadBarGloss.className = "loadBarGloss";
        loadBar.className = "loadBar";
        loadBarSkin.className = "loadBarSkin";

        logoImg.className = "splashLogoImg";
        microLogoImg.className = "microLogoImg";
        nikonLogoImg.className = "nikonLogoImg";
        logoTxt.className = "splashText splashLogoTxt";
        logoTxt.innerHTML = "Interactive HTML5 Tutorial";
        loadText.className = "splashText splashTextLoad";
        loadText.innerHTML = "Loaded: 0%";

        var rootPath = "./images/";
        logoImg.setAttribute("data-src", rootPath + "splash background.png");
        microLogoImg.setAttribute("data-src", rootPath + "microscopyU logo.png");
        nikonLogoImg.setAttribute("data-src", rootPath + "nikon logo.png");

        MEUtil.loadFromDataSrc([logoImg, microLogoImg, nikonLogoImg],
            {
                onComplete: (function (loadContainer) {
                    return function () {
                        MEUtil.appendChildren(loadBarFill, [loadBarSkin])
                        MEUtil.appendChildren(loadBar, [loadBarFill])
                        MEUtil.appendChildren(loadBarContainer, [loadBarGloss, loadBar]);

                        var frag = document.createDocumentFragment();
                        MEUtil.appendChildren(frag, [logoTxt, loadBarContainer, loadText]);
                        loadContainer.appendChild(frag);

                        //start fadeIns
                        TweenLite.to(loadText, .3, { css: { opacity: 1 }, delay: 1.1, onComplete: startPreload });
                        TweenLite.to(logoTxt, .1, { css: { opacity: 1, top: 192 }, delay: 0.8 });
                        TweenLite.to(logoImg, .3, { css: { opacity: 1 }, delay: 0.4 });
                        TweenLite.to(microLogoImg, .3, { css: { opacity: 1 }, delay: 0.4 });
                        TweenLite.to(nikonLogoImg, .3, { css: { opacity: 1 }, delay: 0.4 });
                        TweenLite.to(loadBarContainer, .3, { css: { opacity: 1 }, delay: 1.1 });

                        // MEUtil.setPrefixedEvent(loadText, "AnimationEnd", startPreload);
                        // startPreload();
                        // setTimeout(startPreload, 1000);
                    };
                })(loadContainer)
            });
    }

    function startPreload() {
        var pathElements = document.querySelectorAll("[data-src]"),
            inc = 26,
            clipW = 0,
            currentW = 0,
            count = pathElements.length,
            w = loadBarContainer.clientWidth - 4,
            allAssets = [];

        // Compile all assets to load.
        (function () {
            var pathElements = document.querySelectorAll("[data-src]");
            for (var i = 0, l = pathElements.length; i < l; i++) {
                allAssets.push(pathElements[i]);
            }
            if (imagePaths) {
                l = imagePaths.length
                for (i = 0; i < l; i++) {
                    allAssets.push(imagePaths[i]);
                }
            }
        })();

        MEUtil.raf(function loadLoop() {
            if (clipW < w) {
                MEUtil.raf(loadLoop);
            } else {
                setTimeout(function () {
                    MEUtil.raf(reverseSplashAnimation);
                }, 500);
            }
            if (clipW < currentW) {
                if (clipW <= currentW - inc) {
                    clipW += inc;
                } else { clipW = currentW; }
                loadBarFill.style.width = clipW + "px";
                loadText.innerHTML = "Loaded: " + Math.round(100 * clipW / w) + "%";
            }
        });

        if (allAssets.length) {
            MEUtil.loadFromDataSrc(allAssets, {
                onProgress: function (e) {
                    currentW = e.progress * w;
                }
            });
        } else { currentW = w; }
    }

    function reverseSplashAnimation() {
        // $(loadContainer).addClass("splashBackgroundReverse");
        // TweenLite.to(loadContainer, .2, {css: {opacity: 0}});
        //$(document.getElementsByClassName("tutorialCanvas")[0]).addClass("splashBackgroundReverse");



        // setTimeout(function() {
        if (callback) { MEUtil.raf(callback); }
        // }, 250);
    }

    function fadeSplash() {
        var handleTransitionEnd = function () {
            loadContainer.parentNode.removeChild(loadContainer);
            splashContainer.parentNode.removeChild(splashContainer);
        };

        TweenLite.to(document.getElementsByClassName("tutorialCanvas")[0], .2, { css: { opacity: 0 } });
        TweenLite.to(loadContainer, .2, { css: { opacity: 0 } });

        document.getElementsByClassName(
            "mainscene")[0].style.visibility = "visible";

        document.getElementsByClassName(
            "tutorialTitle")[0].style.visibility = "visible";

        // MEUtil.setPrefixedEvent(splashContainer, "TransitionEnd",
        //     handleTransitionEnd.bind(this), false);

        // splashContainer.style.opacity = 0;

        TweenLite.to(splashContainer, .5, { css: { opacity: 0 }, onComplete: handleTransitionEnd });
    }
}

function NikComponent(id) {
    if (id) {
        this._container = typeof id === "string" ?
            document.getElementById(id) : id;
        this._isEnabled = true;
        this._enabledTransition = false;
        this._isDisabled = false;

        if (MEUtil.IS_TOUCH_DEVICE) {
            this._container.addEventListener("touchstart", function (e) {
                /*Prevent any default actions from the browser when a user
                interacts with the component*/
                e.preventDefault();
                e.stopPropagation();
            }, false);
        }
    } else {
        console.error(id + " is not a valid id string or HTMLElement.");
    }
}

NikComponent.prototype.addEventListener = function (type, listener) {
    type = "on" + type;
    var handlers = this[type];
    if (handlers) {
        if (typeof handlers === "function") {
            this[type] = [handlers, listener];
        } else {
            this[type].push(listener);
        }
    } else {
        this[type] = [listener];
    }
};

NikComponent.prototype.getElement = function () {
    return this._container;
};

NikComponent.prototype.getEnabled = function () {
    return this._isEnabled;
};

NikComponent.prototype.setEnabled = function (isEnabled) {
    if (isEnabled != this._isEnabled) {
        if (isEnabled) {
            this._enable();
        } else {
            this._disable();
        }
    }
    else if (isEnabled == false && this._enabledTransition) {
        this._disable();
        this._isDisabled = true;
    }
};

NikComponent.prototype._enable = function () {
    var style = this._container.style;
    var funcWrapper = (function (that) {
        function transEndListener(event) {
            var style = event.currentTarget.style;
            MEUtil.removePrefixedEvent(this._container, "TransitionEnd", funcWrapper);
            if (!this._isDisabled) {
                style.cursor = "pointer";
                this._isEnabled = true;
            }
            this._isDisabled = false;
            this._enabledTransition = false;
        }
        return transEndListener.bind(that);
    })(this);
    this._enabledTransition = true;
    MEUtil.setPrefixedEvent(this._container, "TransitionEnd", funcWrapper);
    style.opacity = "1";
};

NikComponent.prototype._disable = function () {
    var style = this._container.style;
    this._isEnabled = false;
    style.cursor = "default";
    style.opacity = 0.5;
};

NikComponent.prototype._dispatchEvent = function (type) {
    var handlers = this["on" + type];
    if (typeof handlers === "function") {
        handlers.call(this, new NikEvent(type, this));
    } else if (handlers) {
        for (var i = 0, l = handlers.length; i < l; i++) {
            handlers[i].call(this, new NikEvent(type, this));
        }
    }
};

/*----------- Class definition for MagLab Slider ----------*/
function NikSlider(id, options) {
    //Kills the need for 'new' operator.
    if (!(this instanceof arguments.callee)) {
        return new arguments.callee(id, options);
    }

    NikComponent.call(this, id);

    var that = this;

    options = options || {};

    /*---------- Public Properties ----------*/
    this.hasChanged = false;
    this.onchange = null;
    this.ontouchstart = null;
    this.ontouchend = null;
    this.tickCount = options.tickCount != undefined ? options.tickCount : 0;

    /*---------- Private Properties (DO NOT USE) ----------*/
    this._config = {
        CSS: {
            container: "slider",
            handle: {
                border: {
                    node: "sliderHandleBorder"
                },
                fill: {
                    node: "sliderHandleFill",
                    down: "sliderHandleFillDown",
                    hover: "sliderHandleFillHover",
                    up: "sliderHandleFillUp"
                }
            },
            track: {
                node: "sliderTrack",
                thresh: "sliderTrackThresh"
            },
            vertical: "verticalSlider"
        }
    };
    this._bounds = {
        left: 0,
        height: 0,
        width: 0
    };
    this._eventFlags = {
        start: false,
        move: false,
        end: false
    };
    this._eventListener = MEUtil.IS_TOUCH_DEVICE ?
        this._touchHandler.bind(this) : this._mouseHandler.bind(this);
    this._handle = {
        border: document.createElement("div"),
        fill: document.createElement("div"),
        height: 0,
        innerHeight: 0,
        innerWidth: 0,
        spectrumCan: null,
        position: 0,
        width: 0,
        x: 0
    };
    this._isActive = false;
    this._isSpectrum = options.isSpectrumSlider;
    this._orient = (function () {
        if (!options.orientation || options.orientation.toLowerCase() == "horizontal") {
            return "width";
        }
        return "height";
    })();
    this._spectrum = {
        index: 0,
        max: 0,
        min: 0
    };
    this._thresh = {
        updating: false,
        element: document.createElement("div"),
        min: 0,
        max: 1
        // min: .05,
        // max: .95
    },
        this._track = {
            height: 0,
            spectrumCan: null,
            node: document.createElement("div"),
            width: 0
        };
    this._tween = false;

    /*---------- Init NikSlider ----------*/
    // Style
    this._attachClasses();

    // Attach nodes
    this._track.node.appendChild(this._thresh.element);
    this._handle.border.appendChild(this._handle.fill);
    MEUtil.appendChildren(this._container, [this._track.node, this._handle.border]);

    // Initialize
    this._handle.height = this._handle.border.offsetHeight;
    this._handle.width = this._handle.border.offsetWidth;
    this._handle.innerHeight = this._handle.fill.offsetHeight;
    this._handle.innerWidth = this._handle.fill.offsetWidth;

    this._bounds.height = this._container.clientHeight - this._handle.height;
    this._bounds.width = this._container.clientWidth - this._handle.width;

    // this._bounds.width = this._thresh.element.offsetWidth;
    // this._bounds.height = this._thresh.element.offsetHeight;

    this._track.width = this._thresh.element.offsetWidth;
    this._track.height = this._thresh.element.offsetHeight;

    // console.log(this._container.clientWidth);
    // console.log(this._handle.width);
    // console.log(this._thresh.element.offsetWidth);

    // this._bounds.left = 75 - this._handle.innerWidth;
    // this._bounds.width = 75;

    // Check if spectrum slider
    if (this._isSpectrum) {
        this._initSpectrum(options);
    }

    this._container.addEventListener(MEUtil.IS_TOUCH_DEVICE ?
        "touchstart" : "mousedown", this._eventListener, false);

    this.setPosition(options.position != undefined ? options.position : 0);
}

MEUtil.makeSuper(NikSlider, NikComponent);

NikSlider.prototype.Orientations = {
    HORIZONTAL: "horizontal",
    VERTICAL: "vertical"
};

NikSlider.prototype.getMinThreshold = function () {
    return this._thresh.max;
};

NikSlider.prototype.getMaxThreshold = function () {
    return this._thresh.min;
};

NikSlider.prototype.getPosition = function (min, max) {
    // var pos = (this._handle.position - this._thresh.min) / (this._thresh.max - this._thresh.min);
    var pos = this._handle.position;
    if (arguments.length) {
        if (max === undefined) {
            return pos * min;
        }
        return min + pos * (max - min);
    }
    return pos;
};

NikSlider.prototype.getSpectrumIndex = function (percent) {
    var min = this._spectrum.min,
        max = this._spectrum.max,
        p = percent == undefined ? this._handle.position : percent;

    return Math.round(min + ((max - min) * p));
};

NikSlider.prototype.getSpectrumRGB = function (percent) {
    var index = this.getSpectrumIndex(percent),
        c = [];

    if (index <= 420) {
        c[0] = 100 + (Math.sin(((index - 380) / 40) * Math.PI) * 31);
        c[2] = 100 + (((index - 380) / 40) * 155);
    } else if (index <= 440) {
        c[0] = 100 - (((index - 420) / 20) * 100);
        c[1] = (index - 440) / 50;
        c[2] = 255;
    } else if (index <= 490) {
        c[1] = ((index - 440) / 50) * 255;
        c[2] = 255;
    } else if (index <= 510) {
        c[1] = 255;
        c[2] = (1 - ((index - 490) / 20)) * 255;
    } else if (index <= 580) {
        c[0] = ((index - 510) / 70) * 255;
        c[1] = 255;
    } else if (index <= 645) {
        c[0] = 255;
        c[1] = (1 - ((index - 580) / 65)) * 255;
    } else if (index <= 700) {
        c[0] = 255;
    } else {
        c[0] = 255 - (((index - 700) / 80) * 155);
    }

    c[0] = (c[0] + 0.5) >> 0;
    c[1] = (c[1] + 0.5) >> 0;
    c[2] = (c[2] + 0.5) >> 0;

    return c;
};

NikSlider.prototype.getSpectrumHex = function (percent) {
    var rgb = this.getSpectrumRGB(percent),
        hexArr = [];
    hex = "#",
        i;

    for (i = 0; i < 10; i++) {
        hexArr[i] = i;
    }
    hexArr = hexArr.concat(["a", "b", "c", "d", "e", "f"]);

    for (var i = 0; i < rgb.length; i++) {
        hex += hexArr[Math.floor(rgb[i] / 16)] + "" + hexArr[(rgb[i] % 16)];
    }

    return hex;
};

NikSlider.prototype.setMinThreshold = function (min) {
    var thresh = this._thresh;
    if (!isNaN(min)) {
        if (min < 0) { min = 0; }

        if (min !== thresh.min && min < thresh.max) {
            thresh.min = min;
            this._updateThreshold();
        } else {
            // console.error("Cannot set the min threshold to be less than the max.");
            thresh.min = 1;
            this._updateThreshold();
        }
    } else {
        console.error("The min must be a valid number.");
    }
};

NikSlider.prototype.setMaxThreshold = function (max) {
    var thresh = this._thresh;
    if (!isNaN(max)) {
        if (max > 1) { max = 1; }

        if (max !== thresh.max && max > thresh.min) {
            thresh.max = max;
            this._updateThreshold();
        } else {
            // console.error("Cannot set the max threshold to be greater than the min.");
            thresh.max = 0;
            this._updateThreshold();
        }
    } else {
        console.error("The max must be a valid number.");
    }
};

NikSlider.prototype.setPosition = function (newPos, shouldTween) {
    // this._setPosition(newPos);
    // console.log("SET 1");
    // console.log(newPos_);
    // var newPos = ((newPos_ - this._thresh.min) / (this._thresh.max - this._thresh.min));
    // var newPos = this._pxToPos(this._getLocal(newPos_));
    newPos = this._constrainPosition(newPos);

    if (typeof newPos === "number") {
        newPos = newPos < 0 ? 0 : newPos > 1 ? 1 : newPos;
        if (shouldTween) {
            this._setTween(true);
        }
        this._prepareHandleTranslation(newPos);
    } else {
        console.error(typeof newPos + "(" + newPos + ") is not a valid argument for " +
            this._container.id + ".setPosition()");
    }
};

NikSlider.prototype.setSpectrumRange = function (min, max) {
    this._setSpectrumRange(min, max);
    this._updateSpectrumTrack();
    this._updateSpectrumHandle();
};

/* Private Properties */
NikSlider.prototype._pointerOffset = function () {
    return MEUtil.IS_TOUCH_DEVICE ? -5 : -this._handle[this._orient] / 2;
};

/* Private Methods */
NikSlider.prototype._attachClasses = function () {
    var css = this._config.CSS;
    $(this._container).addClass(css.container);
    if (this._orient == "height") {
        $(this._container).addClass(css.vertical);
    }
    $(this._track.node).addClass(css.track.node + " webkitMaskOverflowFix");
    $(this._thresh.element).addClass(css.track.thresh);
    $(this._handle.border).addClass(css.handle.border.node);
    $(this._handle.fill).addClass(css.handle.fill.node + " " + css.handle.fill.up);
};

NikSlider.prototype._constrainPosition = function (pos) {
    var thresh = this._thresh;

    // console.log("cont");

    // Constrain pos to threshold
    pos = pos < thresh.min ? thresh.min :
        pos > thresh.max ? thresh.max : pos;

    // Constrain pos to nearest tick
    if (this.tickCount > 1) {
        var n = this.tickCount - 1;
        pos = ((0.5 + (pos * n)) | 0) / n;
    }

    return pos;
};

NikSlider.prototype._containerPt = function () {
    if (this._orient == "height") {
        return MEUtil.getGlobalY(this._container) - this._pointerOffset();
    } else {
        return MEUtil.getGlobalX(this._container) - this._pointerOffset();
    }
};

NikSlider.prototype._containerX = function () {
    return MEUtil.getGlobalX(this._container) - this._pointerOffset();
};

NikSlider.prototype._containerY = function () {
    return MEUtil.getGlobalY(this._container) - this._pointerOffset();
};

NikSlider.prototype._createSpectrumCanvii = function () {
    this._handle.spectrumCan = MEUtil.createCanvas(
        this._handle.innerWidth, this._handle.innerHeight);
    this._track.spectrumCan = MEUtil.createCanvas(this._track.width, this._track.height);

    this._handle.spectrumCan.className = "sliderHandleFill sliderHandleSpectrumCanvas";
    this._track.spectrumCan.className = "sliderTrackThresh";

    this._handle.border.appendChild(this._handle.spectrumCan);
    this._track.node.appendChild(this._track.spectrumCan);
};

NikSlider.prototype._displayLoop = function () {
    if (this._isActive) { MEUtil.raf(this._displayLoop.bind(this)); }

    var flags = this._eventFlags;

    if (flags.start) {
        flags.start = false;
        this._setHandleStyleDown();
    }

    if (flags.move) {
        flags.move = false;
        this._moveHandle();
    }

    if (flags.end) {
        flags.end = false;
        this._setHandleStyleUp();
    }

    if (this._isSpectrum) {
        this._updateSpectrumHandle();
    }
};

NikSlider.prototype._getLocal = function (touchPt) {
    return touchPt - this._containerPt();
};

NikSlider.prototype._getLocalX = function (touchPt) {
    return touchPt - this._containerX();
};

NikSlider.prototype._getLocalY = function (touchPt) {
    return touchPt - this._containerY();
};

NikSlider.prototype._getThreshMinPercent = function (val) {
    return val / (this._track[this._orient] - this._handle[this._orient]);
};

NikSlider.prototype._getThreshMaxPercent = function (threshMax) {
    var iw = this._handle[this._orient];
    return (threshMax - iw) / (this._track[this._orient] - iw);
};

NikSlider.prototype._getThreshMinX = function (min) {
    return min * this._track[this._orient];
};

NikSlider.prototype._getThreshMaxX = function (max) {
    return max * this._track[this._orient];
};

NikSlider.prototype._handleTouchStart = function (touchPt) {
    if (!this._tween) {
        this._setTween(true);
    }
    this._isActive = true;
    this._eventFlags.start = true;
    this._setPosition(this._pxToPos(this._getLocal(touchPt)));

    MEUtil.raf(this._displayLoop.bind(this));

    this._dispatchEvent("touchstart");
};

NikSlider.prototype._handleTouchMove = function (touchPt) {
    if (this._tween && this.tickCount < 2) {
        this._setTween(false);
    }
    this._setPosition(this._pxToPos(this._getLocal(touchPt)));
};

NikSlider.prototype._handleTouchEnd = function () {
    this._eventFlags.end = true;
    this._isActive = false;
    this._dispatchEvent("touchend");
};

NikSlider.prototype._initSpectrum = function (options) {
    var min = 400, max = 700;

    if (options.spectrumRange) {
        min = options.spectrumRange.min ? options.spectrumRange.min : min;
        max = options.spectrumRange.max ? options.spectrumRange.max : max;
    }

    this._createSpectrumCanvii();
    this._setSpectrumRange(min, max);
    this._updateSpectrumTrack();
    this._updateSpectrumHandle();
};

NikSlider.prototype._moveHandle = function () {
    if (this._orient == "height") {
        this._handle.border.style[MEUtil.getPrefixedProp("Transform")] =
            "translateY(" + this._handle.y + "px)";
    } else {
        this._handle.border.style[MEUtil.getPrefixedProp("Transform")] =
            "translateX(" + this._handle.x + "px)";
    }
};

NikSlider.prototype._posToPx = function (dec) {
    var ratio = this._track[this._orient] / this._bounds[this._orient],
        pad = this._bounds[this._orient] - this._track[this._orient] - this._handle[this._orient] / 2,
        dis = this._track[this._orient] + this._handle[this._orient] / 2;

    // return (0.5 + dec * this._bounds[this._orient]) | 0;
    // return (0.5 + dec * dis + ((1-dec)*pad)) | 0;
    return (dec * dis + ((1 - dec) * pad)) | 0;
};

NikSlider.prototype._pxToPos = function (px) {
    var ratio = this._track[this._orient] / this._bounds[this._orient],
        pad = this._bounds[this._orient] - this._track[this._orient] - this._handle[this._orient] / 2,
        dis = this._track[this._orient] + this._handle[this._orient] / 2;

    // return px / this._bounds[this._orient];
    return px / (dis) - ((1 - (px / dis)) * (pad + 0.5) / dis);
    // return px / (dis) - ( (1-(px/dis)) * pad/dis );
};

NikSlider.prototype._prepareHandleTranslation = function (pos) {
    this._handle.position = pos;
    if (this._orient == "height") {
        this._handle.y = this._posToPx(pos);
    } else {
        this._handle.x = this._posToPx(pos);
    }

    this._eventFlags.move = true;
    this.hasChanged = true;

    if (!this._isActive) {
        MEUtil.raf(this._displayLoop.bind(this));
    }

    this._dispatchEvent("change");
};

NikSlider.prototype._setHandleStyleDown = function () {
    var handleCSS = this._config.CSS.handle;
    $(this._handle.border).addClass(handleCSS.border.down);
    $(this._handle.fill).addClass(handleCSS.fill.down);
};

NikSlider.prototype._setHandleStyleUp = function () {
    var handleCSS = this._config.CSS.handle;
    // $(this._handle.border).removeClass(handleCSS.border.down);
    $(this._handle.fill).removeClass(handleCSS.fill.down);
};

NikSlider.prototype._setPosition = function (newPos, shouldTween) {
    newPos = this._constrainPosition(newPos);

    if (newPos != this._handle.position) {
        this.setPosition(newPos);
    }
};

NikSlider.prototype._setSpectrumRange = function (min, max) {
    this._spectrum.min = min;
    this._spectrum.max = max;
};

NikSlider.prototype._setTween = function (shouldTween) {
    if (this._tween !== shouldTween) {
        $(this._handle.border)[shouldTween ?
            "addClass" : "removeClass"]("sliderHandleTween");
        this._tween = shouldTween;
    }
};

NikSlider.prototype._mouseHandler = function (event) {
    event.stopPropagation();
    event.preventDefault();

    var clientPt = this._orient == "height" ? "clientY" : "clientX";

    switch (event.type) {
        case "mousemove":
            this._handleTouchMove(event[clientPt]);
            break;
        case "mousedown":
            if (event.which === 1 && this._isEnabled) {
                this._container.removeEventListener("mousedown",
                    this._eventListener);
                MEUtil.on(document, "mousemove mouseup mouseout",
                    this._eventListener);

                this._handleTouchStart(event[clientPt]);
            }
            break;
        case "mouseout": // Fall-through (if on body)
            var style = document.defaultView.getComputedStyle(document.querySelector("body"),
                "").getPropertyValue("outline-style");
            if (style === "dashed") {
                break;
            }
        case "mouseup":
            MEUtil.off(document, "mousemove mouseup mouseout", this._eventListener);
            this._container.addEventListener("mousedown",
                this._eventListener);

            this._handleTouchEnd();
    }
};

NikSlider.prototype._touchHandler = function (event) {
    var touchPt = this._orient == "height" ? "pageY" : "pageX";
    switch (event.type) {
        case "touchmove":
            var touches = event.changedTouches;
            for (var i = 0, l = touches.length; i < l; i++) {
                if (this._touch.identifier === touches[i].identifier) {
                    this._handleTouchMove(touches[i][touchPt]);
                    break;
                }
            }
            break;
        case "touchstart":
            if (this._isEnabled) {
                this._container.removeEventListener("touchstart",
                    this._eventListener);
                MEUtil.on(document, "touchmove touchend touchcancel",
                    this._eventListener);

                var touch = event.changedTouches[0];
                this._touch = touch;
                this._handleTouchStart(touch[touchPt]);
            }
            break;
        case "touchcancel": //Fall-through
        case "touchend":
            var touches = event.changedTouches;
            for (var i = 0, l = touches.length; i < l; i++) {
                if (this._touch.identifier === touches[i].identifier) {
                    MEUtil.off(document, "touchmove touchend touchcancel",
                        this._eventListener);
                    this._container.addEventListener("touchstart",
                        this._eventListener);

                    this._handleTouchEnd();
                    break;
                }
            }
    }
};

NikSlider.prototype._updateSpectrumHandle = function () {
    var ctx = this._handle.spectrumCan.getContext("2d"),
        pix = this.getSpectrumRGB(this._handle.position);

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, this._handle.innerWidth, this._handle.innerHeight);
    ctx.fillStyle = "rgb(" + pix.join(",") + ")";
    ctx.fillRect(1, 1, this._handle.innerWidth - 2, this._handle.innerHeight - 2);
};

NikSlider.prototype._updateSpectrumTrack = function () {
    var ctx = this._track.spectrumCan.getContext("2d"),
        pix = [],
        w = this._track.width,
        h = this._track.height;

    ctx.clearRect(0, 0, w, h);

    if (this._orient == "height") {
        for (var i = 0; i < h; i++) {
            pix = this.getSpectrumRGB(i / h);
            ctx.fillStyle = "rgb(" + pix.join(",") + ")";
            ctx.fillRect(0, i, w, 1);
        }
    } else {
        for (var i = 0; i < w; i++) {
            pix = this.getSpectrumRGB(i / w);
            ctx.fillStyle = "rgb(" + pix.join(",") + ")";
            ctx.fillRect(i, 0, 1, h);
        }
    }
};

NikSlider.prototype._updateThreshold = function () {
    if (!this._thresh.updating) {
        this._thresh.updating = true;

        var update = function () {
            var thresh = this._thresh;

            if (this._orient == "height") {
                thresh.element.style.clip = "rect(" + Math.round(this._getThreshMaxX(thresh.max)) +
                    "px 0 " + Math.round(this._getThreshMinX(thresh.min)) + "px "
                    + thresh.element.clientWidth + "px)";
            } else {
                thresh.element.style.clip = "rect(0 " + Math.round(this._getThreshMaxX(thresh.max)) +
                    "px " + thresh.element.clientHeight + "px " +
                    Math.round(this._getThreshMinX(thresh.min)) + "px)";
            }
            thresh.updating = false;

            this._setPosition(this.getPosition());
        };

        MEUtil.raf(update.bind(this));
    }
};

/* ---------- MagLab Button ------------ */

function NikButton(id, isToggle) {
    //Kills the need for 'new' operator.
    if (!(this instanceof arguments.callee)) {
        return new arguments.callee(id, isToggle);
    }

    NikComponent.call(this, id);

    /*---------- Public Properties ----------*/
    this.text = document.createElement("div");
    this.toggleText = null;
    this.ontouchstart = null;
    this.ontouch = null;

    /*---------- Private Properties (DO NOT USE) ----------*/
    this._isEnabled = true;
    this._isToggle = isToggle;
    this._isToggledOn = false;

    /*---------- Private Methods (DO NOT USE) ----------*/
    this._eventListener = MEUtil.IS_TOUCH_DEVICE ?
        this._touchHandler.bind(this) : this._mouseHandler.bind(this);

    /*---------- Init NikButton ----------*/
    $(this._container).addClass("button");

    var w = this._container.clientWidth,
        h = this._container.clientHeight;
    this.text.style.lineHeight = h + "px";
    $(this.text).addClass("buttonText");
    this.text.innerHTML = this._container.innerHTML;

    this._container.innerHTML = "";

    if (isToggle) {
        var crater = document.createElement("div");
        this.text.style.left = "20px";
        this.text.style.width = (w - 29) + "px";
        $(crater).addClass("buttonCrater");
        crater.style[MEUtil.getPrefixedProp("Transform")] = "translate(5px, " +
            ((h - 14) / 2) + "px)";
        this._light = document.createElement("div");
        $(this._light).addClass("buttonLight");

        crater.appendChild(this._light);
        this._container.appendChild(crater);
    }

    this._container.appendChild(this.text);

    //Attach initial handlers
    this._container.addEventListener(MEUtil.IS_TOUCH_DEVICE ?
        "touchstart" : "mouseover", this._eventListener);

}

MEUtil.makeSuper(NikButton, NikComponent);

NikButton.prototype.getToggleState = function () {
    return this._isToggledOn;
};

NikButton.prototype.setToggleState = function (isToggledOn, shouldCallEvent) {
    this._setToggle(isToggledOn);

    if (shouldCallEvent) {
        if (this.ontouch) { MEUtil.raf(this.ontouch.bind(this)); }
    }
};

/*---------- Private Properties (DO NOT USE) ----------*/
NikButton.prototype._mouseHandler = function (event) {
    event.stopPropagation();
    event.preventDefault();
    var container = this._container;

    switch (event.type) {
        case "mousedown":
            if (event.which === 1 && this._isEnabled) {
                $(container).removeClass("buttonOver");

                MEUtil.off(container, "mousedown", this._eventListener);
                MEUtil.on(container, "mouseup mouseout", this._eventListener);

                this._setStateDown();
            }
            break;
        case "mouseover":
            $(container).addClass("buttonOver");

            MEUtil.off(container, "mouseover", this._eventListener);
            MEUtil.on(container, "mousedown mouseout", this._eventListener);
            break;
        case "mouseout":
            $(container).removeClass("buttonDown");
            $(container).removeClass("buttonOver");

            MEUtil.off(container, "mouseout mouseup", this._eventListener);
            MEUtil.on(container, "mouseover", this._eventListener);
            break;
        case "mouseup":
            $(container).addClass("buttonOver");

            MEUtil.off(container, "mouseup", this._eventListener);
            MEUtil.on(container, "mousedown", this._eventListener);

            this._setStateUp();
    }

};

NikButton.prototype._touchHandler = function (event) {
    var container = this._container;
    switch (event.type) {
        case "touchstart":
            if (this._isEnabled) {
                this._touch = event.changedTouches[0];

                container.removeEventListener("touchstart", this._eventListener);
                MEUtil.on(container, "touchend touchcancel", this._eventListener);

                this._setStateDown();
            }
            break;
        case "touchcancel": //Fall-through
        case "touchend":
            var touches = event.changedTouches;
            for (var i = 0, l = touches.length; i < l; i++) {
                if (this._touch.identifier === touches[i].identifier) {
                    MEUtil.off(container, "touchend touchcancel",
                        this._eventListener);
                    container.addEventListener("touchstart", this._eventListener);

                    this._setStateUp();
                    break;
                }
            }
    }
};

NikButton.prototype._setToggle = function (newState) {
    this._isToggledOn = newState;
    this._light.style.opacity = newState ? 1 : 0;
    if (this.toggleText) {
        if (this.toggleText.length > 1) {
            this.text.innerHTML = this.toggleText[+newState];
        } else {
            this.text.innerHTML = this.toggleText[0];
        }
    }
};

NikButton.prototype._setStateUp = function () {
    $(this._container).removeClass("buttonDown");
    if (this._isToggle) {
        this._setToggle(!this._isToggledOn);
    }
    this._dispatchEvent("touch");
};

NikButton.prototype._setStateDown = function () {
    $(this._container).addClass("buttonDown");
    this._dispatchEvent("touchstart");
};

//Class Definition for MagLab Segment Button
function NikRadioGroup(id, options) {
    //Kills the need for 'new' operator.
    if (!(this instanceof arguments.callee)) {
        return new arguments.callee(id, options);
    }

    NikComponent.call(this, id);

    options = options || {};

    /*---------- Public Events ----------*/
    this.onchange = null;
    this.ontouchstart = null;

    /*---------- Private Properties ----------*/
    this._config = {
        CSS: {
            group: "radioGroup",
            button: "radioButton",
            horizontal: "horizontalRadioGroup",
            vertical: "verticalRadioGroup",
            selected: "radioButtonSelected"
        }
    };
    this._borderRadius = options.borderRadius || "3px";
    this._btns = this._createButtonArray(this._container.children);
    this._eventListener = MEUtil.IS_TOUCH_DEVICE ?
        this._touchHandler.bind(this) : this._mouseHandler.bind(this);
    this._gutterSize = "1px";
    this._orientation = options.orientation &&
        options.orientation.toLowerCase() || "horizontal";
    this._selectedBtn = null;
    this._touches = null;

    /*---------- Initial Setup ----------*/
    $(this._container).addClass("webkitMaskOverflowFix");
    this._addClass(this._container, "group");
    this._updateButtons();
    this._attachHandlers();
}

MEUtil.makeSuper(NikRadioGroup, NikComponent);

NikRadioGroup.prototype.getButtonAtIndex = function (index) {
    return this._btns[index] || null;
};

NikRadioGroup.prototype.getLength = function () {
    return this._btns.length;
};

NikRadioGroup.prototype.getSelectedButton = function () {
    return this._selectedBtn || null;
};

NikRadioGroup.prototype.getSelectedIndex = function () {
    return this._selectedBtn ? this._selectedBtn.haRadioIndex : null;
};

NikRadioGroup.prototype.setBorderRadius = function (newRad, backRad) {
    if (!isNaN(newRad)) {
        backRad = isNaN(backRad) ? newRad + 2 : backRad;

        var css = this._config.CSS;
        MEUtil.setRuleProperty("." + css.horizontal + ":first-child",
            "border-radius", newRad + "px 0 0 " + newRad + "px");
        MEUtil.setRuleProperty("." + css.horizontal + ":last-child",
            "border-radius", "0 " + newRad + "px " + newRad + "px 0");
        MEUtil.setRuleProperty("." + css.vertical + ":first-child",
            "border-radius", newRad + "px " + newRad + "px 0 0");
        MEUtil.setRuleProperty("." + css.vertical + ":last-child",
            "border-radius", "0 0 " + newRad + "px " + newRad + "px");
        MEUtil.setRuleProperty("." + css.group, "border-radius", backRad + "px");
    }
};

NikRadioGroup.prototype.setButtonStyleProperty = function (propName, valArr) {
    var btns = this._btns,
        l = btns.length,
        btn = null;
    if (typeof propName === "string" && typeof valArr === "object" &&
        valArr.length && valArr.length === l) {
        for (var i = 0; i < l; i++) {
            btns[i].style.setProperty(propName, valArr[i], null);
        }
    } else {
        console.error("Style property: " + propName +
            " was unable to be added with the values: " + valArr);
    }
};

NikRadioGroup.prototype.setButtonTitle = function (index, title) {
    var btns = this._btns;
    if (typeof index === "number" && title !== undefined) {
        if (index >= 0 && index < btns.length) {
            btns[parseInt(index, 10)].children[0].innerHTML = title;
        }
    } else {
        console.error(index + " and " + title +
            " are not valid arguments.  Pass a number and string.");
    }
};

NikRadioGroup.prototype.setCSSConfiguration = function (cssConfig) {
    var rules = this._config.CSS;
    for (var prop in cssConfig) {
        if (rules[prop]) {
            rules[prop] = cssConfig[prop];
        } else {
            console.error(prop + " is not a configuration property.");
        }
    }
    this._updateButtons();
};

NikRadioGroup.prototype.setCustomProperty = function (propName, valArr) {
    var btns = this._btns,
        l = btns.length;
    if (typeof propName === "string" && typeof valArr === "object" &&
        valArr.length && valArr.length === l) {
        for (var i = 0; i < l; i++) {
            btns[i][propName] = valArr[i];
        }
    } else {
        console.error("Custom property: " + propName +
            " was unable to be added with the values: " + valArr);
    }
};

NikRadioGroup.prototype.setGutterSize = function (newSize) {
    newSize = typeof newSize === "number" ? newSize + "px" : newSize;

    MEUtil.setRuleProperty("." + this._config.CSS.vertical + ":nth-child(n+2)",
        "margin", newSize + " 0 0 0");
    MEUtil.setRuleProperty("." + this._config.CSS.horizontal + ":nth-child(n+2)",
        "margin", "0 0 0 " + newSize);
};

NikRadioGroup.prototype.setOrientation = function (newOrient) {
    newOrient = newOrient.toLowerCase() || this._orientation;
    if (newOrient === "horizontal" || newOrient === "vertical") {
        if (this._orientation !== newOrient) {
            this._orientation = newOrient;
            this._updateButtons();
        }
    }
};

NikRadioGroup.prototype.setSelectedIndex = function (newSelection, shouldDispatch) {
    if (isNaN(newSelection)) {
        this._unselect(this._selectedBtn);
        this._selectedBtn = null;
    } else {
        if (!this._selectedBtn || newSelection !== this._selectedBtn.haRadioIndex) {
            var btns = this._btns,
                btn = btns[newSelection < -1 ? 0 :
                    newSelection >= btns.length ? btns.length - 1 :
                        parseInt(newSelection, 10)];

            shouldDispatch = shouldDispatch === undefined ? true : shouldDispatch;

            this._handleBtnPressed(btn);
            this._handleBtnReleased(btn, shouldDispatch);
        }
    }
};

NikRadioGroup.prototype.setTitles = function (newTitles) {
    if (newTitles && newTitles.length) {
        var btns = this._btns;
        for (var i = 0, l = btns.length; i < l; i++) {
            btns[i].children[0].innerHTML = newTitles[i] ||
                btns[i].children[0].innerHTML;
        }
    } else {
        console.error("setTitles: " + newTitles +
            " - value passed was not a valid array.");
    }
};

NikRadioGroup.prototype._addClass = function (element, className) {
    $(element).addClass(this._config.CSS[className]);
};

NikRadioGroup.prototype._addTouchListener = function (btn) {
    var eType = MEUtil.IS_TOUCH_DEVICE ? "touchstart" : "mouseover";

    btn.addEventListener(eType, this._eventListener);
};

NikRadioGroup.prototype._addTouchEndListener = function (btn) {
    var onTypes = MEUtil.IS_TOUCH_DEVICE ?
        "touchend touchcancel" : "mouseup mouseout",
        offType = MEUtil.IS_TOUCH_DEVICE ? "touchstart" : "mousedown";

    btn.removeEventListener(offType, this._eventListener);

    MEUtil.on(btn, onTypes, this._eventListener);
};

NikRadioGroup.prototype._attachHandlers = function () {
    var btns = this._btns,
        btn = null;

    for (var i = 0, l = btns.length; i < l; i++) {
        btn = btns[i];
        this._addTouchListener(btn);
    }
};

NikRadioGroup.prototype._createButtonArray = function (srcArr) {
    var btns = [];
    for (var i = 0, l = srcArr.length; i < l; i++) {
        var btn = document.createElement("div");
        btn.appendChild(srcArr[i].cloneNode(true));
        if (srcArr[i].className) {
            btn.userClassName = srcArr[i].className;
        }
        btns[i] = btn;
    }
    return btns;
};

NikRadioGroup.prototype._handleBtnPressed = function (btn, shouldDispatch) {
    this._addClass(btn, "selected");

    this._addTouchEndListener(btn);

    if (shouldDispatch) {
        this._dispatchEvent("touchstart");
    }
};

NikRadioGroup.prototype._handleBtnReleased = function (btn, shouldDispatch) {
    var selectedBtn = this._selectedBtn;
    if (btn) {
        this._removeTouchEndListener(btn);

        if (this._touches && this._touches.length) {
            /*If there are multiple touches*/
            this._unselect(btn);
        } else {
            if (selectedBtn) {
                this._unselect(selectedBtn);
            }
            this._selectedBtn = btn;
            if (shouldDispatch) {
                this._dispatchEvent("change");
            }
        }
    }
};

NikRadioGroup.prototype._mouseHandler = function (event) {
    event.preventDefault();
    var btn = event.currentTarget;
    if (btn != this._selectedBtn) {
        switch (event.type) {
            case "mousedown":
                if (event.which === 1 && this._isEnabled) {
                    $(btn).removeClass("buttonOver");
                    this._handleBtnPressed(btn, true);
                }
                break;
            case "mouseover":
                $(btn).addClass("buttonOver");

                MEUtil.off(btn, "mouseover", this._eventListener);
                MEUtil.on(btn, "mousedown mouseout", this._eventListener);
                break;
            case "mouseout":
                $(btn).removeClass("buttonOver");
                $(btn).removeClass("radioButtonSelected");

                MEUtil.off(btn, "mouseout mouseup", this._eventListener);
                MEUtil.on(btn, "mouseover", this._eventListener);
                break;
            case "mouseup":
                $(btn).removeClass("buttonOver");
                this._handleBtnReleased(btn, true);
        }
    }

};

NikRadioGroup.prototype._removeClass = function (element, className) {
    $(element).removeClass(this._config.CSS[className]);
};

NikRadioGroup.prototype._removeTouchEndListener = function (btn) {
    var eTypes = MEUtil.IS_TOUCH_DEVICE ?
        "touchend touchcancel" : "mouseup mouseout";

    MEUtil.off(btn, eTypes, this._eventListener);
};

NikRadioGroup.prototype._touchHandler = function (event) {
    var btn = event.currentTarget;
    this._touches = event.touches;
    switch (event.type) {
        case "touchstart":
            if (this._isEnabled) {
                this._handleBtnPressed(btn, true);
            }
            break;
        case "touchcancel": //Fall-through
        case "touchend":
            this._handleBtnReleased(btn, true);
    }
};

NikRadioGroup.prototype._unselect = function (btn) {
    if (btn) {
        this._removeClass(btn, "selected");
        this._addTouchListener(btn);
    }
};

NikRadioGroup.prototype._updateButtons = function () {
    var btns = this._btns,
        btn = null;

    this._container.innerHTML = "";

    for (var i = 0, l = btns.length; i < l; i++) {
        btn = btns[i];
        btn.haRadioIndex = i;
        btn.style.className = btn.userClassName || "";
        this._addClass(btn, "button");
        this._addClass(btn, this._orientation);
    }

    MEUtil.appendChildren(this._container, btns);
};

function NikLoader(el_id) {
    this._container = typeof el_id === "string" ? document.getElementById(el_id) : el_id;
    this._container.className = "loader";
    this._container.innerHTML = "Loading";
}

NikLoader.prototype.show = function () {
    this._container.style.opacity = 1;
};

NikLoader.prototype.hide = function () {
    this._container.style.opacity = 0;
};

/* Google Analytics */
/*
var gaJsHost = (("https:" == document.location.protocol) ? "https://ssl." : "http://www.");
document.write(unescape("%3Cscript src='" + gaJsHost + "google-analytics.com/ga.js' type='text/javascript'%3E%3C/script%3E"));
var pageTracker; 
setTimeout(function(){
    pageTracker = _gat._getTracker("UA-5153488-2");
    pageTracker._trackPageview();
}, 5000);
*/
/* Google Analytics */
