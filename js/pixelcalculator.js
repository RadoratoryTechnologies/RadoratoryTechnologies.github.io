function startTutorial() {
    var _sldr = (function () {
        var sldrArr = [],
            sldrEls = document.getElementsByClassName("sldr"),
            sldrReadOutEls = document.getElementsByClassName("sldrReadOut");

        for (var i = 0; i < sldrEls.length; i++) {
            var sldr = new NikSlider(sldrEls[i].id);
            sldr.readOut = sldrReadOutEls[i];
            sldrArr.push(sldr);
        }

        return sldrArr;
    })(),
        _ccdEls = (function () {
            var obj = {},
                els = document.getElementsByClassName("ccdNumber");

            for (var i = 0; i < els.length; i++) {
                var el = els[i];
                obj[el.id] = el;
            }

            return obj;
        })(),
        _readOut = (function () {
            var arr = [],
                els = document.getElementsByClassName("readOut");

            for (var i = 0; i < els.length; i++) {
                var el = els[i];
                arr.push(el);
            }

            return arr;
        })(),
        _sldrTopRight = new NikSlider("sldrTopRight"),
        _segment = document.getElementById("segment"),//new NikRadioGroup("segment"),
        _specimen = {},
        _objective = {},
        _ccd = {},
        _magIndex,
        _magSelect = ["2x", "4x", "10x", "20x", "40x", "60x", "100x"],
        _specimenImg = document.getElementById("specimenImg"),
        _comboBox = document.getElementsByTagName("select")[0],
        _comboBoxIndex = 0,
        _specimenMask = MEUtil.upscaleCanvas("specimenMask"),
        _maskCtx = _specimenMask.getContext("2d"),
        _rectRegion = document.getElementById("rectRegion"),
        _splash = NikSplash(initialize);

    function initialize() {
        loadXMLFiles(function () {
            _sldrTopRight.readOut = document.getElementById("sldrTopRightReadOut");
            addListeners();
            initControls();
            populateCBoptions(_comboBox, _specimen);
            MEUtil.raf(enterFrameHandler);
            var randomImg = Math.floor(Math.random() * _specimen.length);
            _comboBoxIndex = randomImg;
            _comboBox.selectedIndex = randomImg;
            _splash.fadeOut();
        });
    }

    function addListeners() {
        _comboBox.onchange = function () {
            _comboBoxIndex = this.selectedIndex;
            changeImage(_comboBoxIndex);
        }

        _segment.onchange = function () {
            var index = this.selectedIndex;
            _ccdEls.ccdMid.innerHTML = _ccd[index].diagonal;
            _ccdEls.ccdRight.innerHTML = _ccd[index].height;
            _ccdEls.ccdBot.innerHTML = _ccd[index].width;
            updateSpecimenRect();
            updateReadOuts();
        }
    }

    function initControls() {
        _segment.selectedIndex = 2;
        _sldr[1].tickCount = _magSelect.length;
        _sldr[2].tickCount = 5;

        _sldr[1].setPosition(getInitTick(_sldr[1].tickCount));
        _sldr[2].setPosition(getInitTick(_sldr[2].tickCount, (_sldr[2].tickCount - 1)));
        _sldr[3].setPosition(Math.random());

        function getInitTick(tickCount, num_) {
            var num = (num_ - 1) || (Math.floor(Math.random() * tickCount)),
                denom = (tickCount - 1);

            return num / denom;
        }
    }

    function changeImage() {
        _specimenImg.onload = function () {
            _ccdEls.ccdMid.style.borderColor = _specimen[_comboBoxIndex].boxColor;
            updateRectRegionColor();
        }
        _specimenImg.src = "images/specimen/" + _specimen[_comboBoxIndex].imgPath + "/" + _magSelect[_magIndex] + ".jpg";
    }

    function populateCBoptions(cb, CBnameArray) {
        for (var i = 0; i < CBnameArray.length; i++) {
            addCBoption(CBnameArray[i].cbName);
        }

        function addCBoption(text) {
            var cbOption = new Option(text);
            cb.appendChild(cbOption);
        }
    }

    function loadXMLFiles(callback) {
        var tmpObj = {},
            fileCounter = 0,
            numberOfFiles = 3;

        parseXMLFile("data/specimen.xml", tmpObj, loadCheck);
        parseXMLFile("data/objectives.xml", tmpObj, loadCheck);
        parseXMLFile("data/ccd.xml", tmpObj, loadCheck);

        function loadCheck() {
            if (++fileCounter == numberOfFiles) {
                _specimen = tmpObj.specimens.specimen; //unpackage object
                _objective = tmpObj.objectives.objective; //unpackage object
                _ccd = tmpObj.ccds.ccd; //unpackage object
                callback();
            }
        }
    }

    function parseXMLFile(file, fileObject, callback) {
        $.ajax({
            type: "GET",
            url: file,
            dataType: "xml",
            error: function () {
                console.log("load error");
            },
            success: function (xml) {
                var firstProp = xml.childNodes[xml.childNodes.length - 1].tagName;
                fileObject[firstProp] = processXMLNode(xml.childNodes[xml.childNodes.length - 1]);
                callback();
            }
        });

        function processXMLNode(node, obj_) {
            var obj = obj_ || {};
            for (var i = 0; i < node.childNodes.length; i++) {
                var innerNode = node.childNodes[i];
                if (innerNode.nodeType != 3) { //do not include the #text
                    var innerObj = {},
                        numberOfChildren = innerNode.childNodes.length - 1, // -1 to exclude #text in output
                        prop = innerNode.nodeName,
                        val = (function () {
                            var returnVal = innerNode.text || innerNode.textContent, //.text chrome / ff .textContent IE
                                parseVal = parseFloat(returnVal);

                            return isNaN(returnVal) ? returnVal : parseVal;
                        })();

                    if (obj[prop]) {
                        if (!(obj[prop] instanceof Array)) {
                            var firstIndex = obj[prop];
                            obj[prop] = [];
                            obj[prop].push(firstIndex);
                        }
                        obj[prop].push(((numberOfChildren == 0) ? val : innerObj));
                    }
                    else {
                        obj[prop] = (numberOfChildren == 0) ? val : innerObj;
                    }

                    processXMLNode(innerNode, innerObj);
                }
            }
            return obj;
        }
    }

    function roundSignificant(f, n) {
        var pow10 = Math.pow(10, n),
            pow5 = 5 / Math.pow(10, n + 1);
        return Math.floor((f + pow5) * pow10) / pow10;
    }

    function getSignificant(f, n) {
        var pow10 = Math.pow(10, n),
            pow5 = 5 / Math.pow(10, n + 1);
        return (f + pow5) * pow10 / pow10;
    }

    function updateFirstSliderText() {
        var index = Math.round(_sldr[1].getPosition() * (_magSelect.length - 1)),
            tickLength = _objective[index].tick.length,
            sldrVal = _objective[index].tick[Math.round(_sldr[0].getPosition() * (tickLength - 1))];

        _sldr[0].readOut.innerHTML = "Numerical<BR>Aperture: " + parseFloat(sldrVal).toFixed(2);
    }

    function updateMask() {
        var width = _specimenMask.width / MEUtil.PIXEL_RATIO,
            height = _specimenMask.height / MEUtil.PIXEL_RATIO,
            radius = calculateMaskDim(Math.round(_sldr[2].getPosition() * 4)) / 2;

        _maskCtx.clearRect(0, 0, width / MEUtil.PIXEL_RATIO, height / MEUtil.PIXEL_RATIO);
        _maskCtx.globalCompositeOperation = "source-over";
        _maskCtx.fillRect(0, 0, width, height);
        _maskCtx.globalCompositeOperation = "destination-out";
        _maskCtx.beginPath();
        _maskCtx.arc(width / 2, height / 2, radius, 0, 2 * Math.PI, false);
        _maskCtx.fill();
    }

    function updateReadOuts() {
        var magIndex = Math.round(_sldr[1].getPosition() * (_magSelect.length - 1)),
            tickLength = _objective[magIndex].tick.length,
            vcMagSldrVal = _sldr[3].getPosition(.2, 2),
            ccdIndex = _segment.selectedIndex,
            objMagVal = parseInt(_magSelect[magIndex]),
            javaTopRightSldrHeight = 72,
            compMonSize = Math.floor(0.25 * _sldrTopRight.getPosition() * javaTopRightSldrHeight) + 9,
            numAperture = _objective[magIndex].tick[Math.round(_sldr[0].getPosition() * (tickLength - 1))],
            optResPre = 0.55 / (2 * numAperture),
            optResVal = getSignificant(optResPre, (optResPre < 1 ? 2 : 1)),
            reqPxSizeVal = getSignificant(optResVal * objMagVal * 0.5 * vcMagSldrVal, 1),
            optCCDArrSizeFirst = 1000 * _ccd[ccdIndex].width / reqPxSizeVal,
            optCCDArrSizeSecond = 1000 * _ccd[ccdIndex].height / reqPxSizeVal,
            monitorMagVal = roundSignificant(compMonSize * 25.4 / _ccd[ccdIndex].diagonal, 1),
            totMagVal = objMagVal * roundSignificant(vcMagSldrVal, 2) * monitorMagVal;

        optCCDArrSizeFirst = Math.floor(optCCDArrSizeFirst / 10 + 0.5) * 10;
        optCCDArrSizeSecond = Math.floor(optCCDArrSizeSecond / 10 + 0.5) * 10;

        _readOut[0].innerHTML = optResVal.toFixed(3) + " &microm";
        _readOut[1].innerHTML = reqPxSizeVal.toFixed(1) + " &microm";
        _readOut[2].innerHTML = optCCDArrSizeFirst + " x " + optCCDArrSizeSecond;
        _readOut[3].innerHTML = monitorMagVal.toFixed(1) + "x";
        _readOut[4].innerHTML = totMagVal.toFixed(1) + "x";
    }

    function updateSpecimenRect() {
        var specimenRect = new Rectangle();
        var ccdIndex = _segment.selectedIndex;
        var ratio = calculateMaskDim(0) * _ccd[ccdIndex].diagonal / (20.8 * _sldr[3].getPosition(.2, 2));
        specimenRect.w = Math.floor(_ccd[ccdIndex].width * ratio / _ccd[ccdIndex].diagonal) + 6;
        specimenRect.h = Math.floor(_ccd[ccdIndex].height * ratio / _ccd[ccdIndex].diagonal) + 6;
        specimenRect.x = (103 - specimenRect.w / 2);
        specimenRect.y = (103 - specimenRect.h / 2);

        _rectRegion.style[MEUtil.getPrefixedProp("transform")] = "translate(" + specimenRect.x + "px, " + specimenRect.y + "px)";
        _rectRegion.style.width = specimenRect.w + "px";
        _rectRegion.style.height = specimenRect.h + "px";
    }

    function updateRectRegionColor() {
        _rectRegion.style.borderColor = _specimen[_comboBoxIndex].boxColor;
    }

    function calculateMaskDim(naSldrTick) {
        var naLength = 5;
        return 200 - (naLength - naSldrTick) * 10;
    }

    function Rectangle(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    function enterFrameHandler(timeStamp) {
        if (_sldr[0].hasChanged) {
            updateReadOuts();
            updateFirstSliderText();
            _sldr[0].hasChanged = false;
        }

        if (_sldr[1].hasChanged) {
            updateReadOuts();
            var index = Math.round(_sldr[1].getPosition() * (_magSelect.length - 1));
            _magIndex = index;
            changeImage();
            _sldr[0].tickCount = _objective[index].tick.length;
            updateFirstSliderText();
            _sldr[1].readOut.innerHTML = "Objective<BR>Magnification: " +
                _magSelect[index];
            _sldr[1].hasChanged = false;
        }

        if (_sldr[2].hasChanged) {
            updateReadOuts();
            updateMask();
            _sldr[2].readOut.innerHTML = "Field Number<BR>(FN): " +
                (18 + Math.round(_sldr[2].getPosition() * 4 * 2));
            _sldr[2].hasChanged = false;
        }

        if (_sldr[3].hasChanged) {
            updateSpecimenRect();
            updateReadOuts();
            _sldr[3].readOut.innerHTML = "Video Coupler<BR>Magnification: " +
                _sldr[3].getPosition(.2, 2).toFixed(2) + "x";
            _sldr[3].hasChanged = false;
        }

        if (_sldrTopRight.hasChanged) {
            updateReadOuts();
            _sldrTopRight.readOut.innerHTML = "Computer Monitor<BR>Size: " +
                (Math.round(_sldrTopRight.getPosition(9, 27) * 2) / 2).toFixed(1) + "\"";
            _sldrTopRight.hasChanged = false;
        }

        MEUtil.raf(enterFrameHandler);
    }
}

$(document).ready(startTutorial);