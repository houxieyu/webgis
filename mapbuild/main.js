var datas;
var result;
var zbnames = ['农业人口数', '农户数', '农户人口数', '规模户数', '规模户人口数', '经营单位数', '实际耕种面积'];
var zblib = [];

//初始化指标列表
function initzb() {
    $('#selxrzb').empty();
    var curtable = $('#seldcdx').val();
    if (curtable != '综合') {
        zblib.forEach(function (x) {
            if (x.substr(0, curtable.length) == curtable)
                $('#selxrzb').append("<option value='" + x + "'>" + x + "</option>");
        })
    } else {
        zblib.forEach(function (x) {
            if (x.substr(0, 2) != '农户' && x.substr(0, 3) != '规模户' && x.substr(0, 4) != '经营单位' &&x!='地区'&&x!='区划码')
                $('#selxrzb').append("<option value='" + x + "'>" + x + "</option>");
        })
    }
}
    //初始化指标列表符号
    function initzbsymbol() {
    $('#selxrzbsize').empty();
    $('#selxrzbopc').empty();
    var curtable = $('#seldcdxsymbol').val();
    if (curtable != '综合') {
        zblib.forEach(function (x) {
            if (x.substr(0, curtable.length) == curtable){
                $('#selxrzbsize').append("<option value='" + x + "'>" + x + "</option>");
                $('#selxrzbopc').append("<option value='" + x + "'>" + x + "</option>");
            }
        })
    } else {
        zblib.forEach(function (x) {
            if (x.substr(0, 2) != '农户' && x.substr(0, 3) != '规模户' && x.substr(0, 4) != '经营单位'&&x!='地区'&&x!='区划码'){
                $('#selxrzbsize').append("<option value='" + x + "'>" + x + "</option>");
                $('#selxrzbopc').append("<option value='" + x + "'>" + x + "</option>");
            }
        })
    }
}
$(function () {
    $("#accordion").accordion({
        collapsible: false
    });
    $("#accordion2").accordion({
        collapsible: true
    });
    //$("#accordion").css({"padding-left":"15px","padding-right":"15px"});
    $("#controlgroup").controlgroup();
    var height = $("#cont").height() - $("#tophead").outerHeight(true) - $("#bar").outerHeight(true);
    $("#map").height(height); //直接设置元素的高

    $("#info").hide();
    $.getJSON("../Scripts/bigdata.json", function (ret) {
        result = ret;
        //读取指标表保存到数组
        for (var zb in ret[0])
            zblib.push(zb);
        //初始化指标组件
        initzb();
        initzbsymbol();
        $('#seldcdx').change(initzb);
        $('#seldcdxsymbol').change(initzbsymbol);
    });
});

var legend;
var map;
var serverip;
$.ajaxSettings.async = false; 
$.getJSON("../Scripts/serverip.json", function (result){
    console.log(result);
    serverip = result.ip;
});
var agoServiceURL = "http://"+serverip+":6080/arcgis/rest/services/lwbj/MapServer/";
var agoLayer;
require([
    "esri/map", "esri/dijit/PopupTemplate", "esri/layers/FeatureLayer", "esri/InfoTemplate",
    "esri/dijit/Legend",
    "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol",
    "esri/geometry/Extent", "esri/renderers/SimpleRenderer",
    "esri/Color", "esri/layers/ArcGISDynamicMapServiceLayer", "esri/symbols/TextSymbol",
    "esri/layers/LabelClass",
    "dojo/number", "dojo/dom-style",
    "dijit/TooltipDialog", "dijit/popup", "esri/graphic", "esri/lang",
    "dojo/domReady!"
], function (
    Map, PopupTemplate, FeatureLayer, InfoTemplate, Legend,
    SimpleLineSymbol, SimpleFillSymbol, Extent, SimpleRenderer,
    Color, ArcGISDynamicMapServiceLayer, TextSymbol, LabelClass, number, domStyle,
    TooltipDialog, dijitPopup, Graphic, esriLang
) {
    map = new Map("map", {
        basemap: "osm",
        zoom: 11,
        slider: false,
        center: [117.67, 36.3],
        showLabels: true
    });
    agoLayer = new ArcGISDynamicMapServiceLayer(agoServiceURL, {
        "opacity": 1
    });
    map.addLayer(agoLayer);

    map.on("load", function () {
        map.graphics.enableMouseEvents();
        map.graphics.on("mouse-out", closeDialog);

    });
    dialog = new TooltipDialog({
        id: "tooltipDialog",
        style: "position: absolute; width: 250px; font: normal normal normal 10pt Helvetica;z-index:100"
    });
    dialog.startup();

    function closeDialog() {
        map.graphics.clear();
        dijitPopup.close(dialog);
    }
});

function filterdatas(layno, result) {
    /** 过滤数据，根据区划长度、区划码 */
    var sublen = 0,
        filtercode = '';
    switch (layno) {
        //大莱芜图层，过滤掉新五区
        case 0:
            sublen = 6;
            filtercode = '37121';
            break;
            //新区图层，过滤掉大莱芜区
        case 1:
            sublen = 6;
            filtercode = '371202';
            break;
        case 2:
            sublen = 9;
            break;
        case 3:
            sublen = 12;
            break;
    }
    //过滤数据，只保留图层中有的区划
    var datas = result.filter(function (x) {
        console.log(x['区划码'].substr(0, (filtercode == '' ? 1 : filtercode.length)));
        return x['区划码'].length == sublen &&
            x['区划码'].substr(0, (filtercode == '' ? 1 : filtercode.length)) != filtercode;
    });

    return datas;
}
var featureLayer;

/**
 * 
 * 转换短区划码
 * 
 */
function getAreaTrim(code) {
    if (code.substr(2, 2) == "00")
        return code.substr(0, 2);
    else if (code.substr(4, 2) == "00")
        return code.substr(0, 4);
    else if (code.substr(6, 3) == "000")
        return code.substr(0, 6);
    else if (code.substr(9, 3) == "000")
        return code.substr(0, 9);
    return code;
}

function RenderMap(rendertype) {
    require([
        "esri/map", "esri/dijit/PopupTemplate", "esri/layers/FeatureLayer", "esri/InfoTemplate",
        "esri/dijit/Legend",
        "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol",
        "esri/geometry/Extent", "esri/renderers/SimpleRenderer",
        "esri/Color", "esri/layers/ArcGISDynamicMapServiceLayer", "esri/symbols/TextSymbol",
        "esri/layers/LabelClass",
        "dojo/number", "dojo/dom-style",
        "dijit/TooltipDialog", "dijit/popup", "esri/graphic", "esri/lang",
        "dojo/domReady!"
    ], function (
        Map, PopupTemplate, FeatureLayer, InfoTemplate, Legend,
        SimpleLineSymbol, SimpleFillSymbol, Extent, SimpleRenderer,
        Color, ArcGISDynamicMapServiceLayer, TextSymbol, LabelClass, number, domStyle,
        TooltipDialog, dijitPopup, Graphic, esriLang
    ) {
        var highlightSymbol = new SimpleFillSymbol(
            SimpleFillSymbol.STYLE_SOLID,
            new SimpleLineSymbol(
                SimpleLineSymbol.STYLE_SOLID,
                new Color([255, 0, 0]), 3
            ),
            new Color([125, 125, 125, 0.35])
        );

        var dzm = '3708';
        var arealvl = 2;
        
        if ($('#radiodlc')[0].checked)
            arealvl = 1;
        if ($('#radioxq')[0].checked)
            arealvl = 2;
        if ($('#radioxz')[0].checked)
            arealvl = 3;
        try {
            if ($('#radiocun')[0].checked)
                arealvl = 4;
        } catch (e) {}
        if (featureLayer != null)
            map.removeLayer(featureLayer);

        var namefield = "NAME";
        var minmax;

        //数据处理
        var tableid, zbname = $('#selxrzb').val();
        //获取地区级别过滤数据，渲染字段名计算minmax
        datas = filterdatas(arealvl - 1, result);
        if(rendertype == 1)
            var pxname = zbname;
        else var pxname = $('#selxrzbsize').val();
        datas.sort(
            (a, b) => b[pxname] - a[pxname]
            // (a,b)=> (
            //     isNaN (parseFloat( b[zbname]))?0:parseFloat( b[zbname])
            // )
            // -(
            //     isNaN (parseFloat( a[zbname]))?0:parseFloat( a[zbname])
            // )
        );
        var url = "";
        url = agoServiceURL + arealvl;
        var areaexp = "AREA_CODE like '3712%'";
        if(arealvl==4)
         var showlabel = false;
        else var showlable = true;
        featureLayer = new FeatureLayer(url, {
            mode: FeatureLayer.MODE_SNAPSHOT,
            definitionExpression: areaexp,
            outFields: ["NAME", "AREA_CODE"],
            opacity: 0.8,
            showLabels:showlabel
        });

        //显示标签
        var statesLabel = new TextSymbol(); //.setColor(new Color("RGB(0,0,0)"));
        statesLabel.font.setSize("12pt");
        statesLabel.font.setFamily("微软雅黑");
        var json = {
            "labelExpressionInfo": {
                "value": "{NAME}"
            }
        };
        var labelClass = new LabelClass(json);
        labelClass.symbol = statesLabel; // symbol also can be set in LabelClass' json
        featureLayer.setLabelingInfo([labelClass]);

        // if (agoLayer != null)
        //     map.removeLayer(agoLayer);
        map.addLayer(featureLayer);
        if(rendertype == 1)
            RenderLayer('3712', zbname, 2);
        else RenderLayerBySymbol('3712', [$('#selxrzbopc').val(),$('#selxrzbsize').val()]);

        function GenerateID(str) {
            var pad = "00"
            return pad.substring(0, pad.length - str.length) + str
        }
        //飘窗
        featureLayer.on("mouse-over", function (evt) {
            var highlightGraphic = new Graphic(evt.graphic.geometry, highlightSymbol);
            map.graphics.add(highlightGraphic);
            //信息内容
            var infostr = "";
            infostr += "<b>" + evt.graphic.attributes.NAME + "</b><br>"
            for (var i = 0; i < zbnames.length; i++) {
                infostr += "<b>" + zbnames[i] + "</b>：" +
                    datas.find((n) => n.区划码 == getAreaTrim(evt.graphic.attributes.AREA_CODE))[
                        zbnames[i]] +
                    "<br>";
            }
            dialog.setContent(infostr);
            domStyle.set(dialog.domNode, "opacity", 0.85);
            dijitPopup.open({
                popup: dialog,
                x: evt.pageX+2,
                y: evt.pageY+2
            });
        });

        if(rendertype == 1)
            var title = "图例：\r\n" + zbname;
            else 
            var title = "图例：\r\n" + $('#selxrzbopc').val()+','+$('#selxrzbsize').val();
        if (legend == null) {
            legend = new Legend({
                map: map,
                layerInfos: [{
                    title: title,
                    layer: featureLayer
                }]
            }, "legend");
            legend.startup();
        }
        $("#info").show();
        legend.refresh([{
            layer: featureLayer,
            title: title
        }]);
        //legend.refresh();

    })
}