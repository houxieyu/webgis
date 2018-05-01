var basezbnames = ['农业人口数', '实际耕种面积', '农户数','规模户数','经营单位数'];
var basezbunits = ['人', '亩'];
var zbnames = ['lwdata.农业人口数', 'lwdata.实际耕种面', 'lwdata.农户数','lwdata.规模户数','lwdata.经营单位数'];
var zbalias = ['农业人口数', '实际耕种面积', '农户数','规模户数','经营单位数'];
var zbunits = ['人', '亩'];
var outfields = ["NAME","AREA_CODE"]
var map;
var serverip;
$.ajaxSettings.async = false; 
$.getJSON("../Scripts/serverip.json", function (result){
    console.log(result);
    serverip = result.ip;
});
var densityURL = "http://"+serverip+":6080/arcgis/rest/services/lwdensity/MapServer";
//叠加区县边界
function addQXBJLayer() {
    require(["esri/layers/FeatureLayer", "esri/renderers/SimpleRenderer",
            "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol", "esri/Color"
        ],
        function (FeatureLayer, SimpleRenderer, SimpleLineSymbol, SimpleFillSymbol, Color) {
            var qxlayer = new FeatureLayer(agoServiceURL + "1", {
                showLabels: true,
                mode: FeatureLayer.MODE_SNAPSHOT,
                outFields: ["NAME"]
            });
            var qxsymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                    new Color([0, 0, 255]), 1), new Color([0, 0, 0, 0])
            );
            //qxsymbol.setOutline(new SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new Color([255, 0, 0]), 2));

            var renderer = new SimpleRenderer(qxsymbol);
            qxlayer.setRenderer(renderer);
            qxlayer.setShowLabels(true);
            map.addLayer(qxlayer);
        });
}
//随机颜色
function createrndcolor(seed) {
    var highColor;
    require(["esri/Color"], function (Color) {
        var ind = Math.random() * 6;
        ind = parseInt(ind, 0);
        if (seed != 99) ind = seed;

        var highval = 50;
        switch (ind) {
            case 0:
                highColor = new Color([highval, 0, 0]);
                break;
            case 1:
                highColor = new Color([0, highval, 0]);
                break;
            case 2:
                highColor = new Color([0, 0, highval]);
                break;
            case 3:
                highColor = new Color([highval, 0, highval]);
                break;
            case 4:
                highColor = new Color([0, highval, highval]);
                break;
            case 5:
                highColor = new Color([highval, highval, 0]);
                break;
        }
    });
    return highColor;
}

//初始化控件布局
function InitLayout() {
    $("#accordion").accordion({
        collapsible: true
    });
    $("#controlgroup").controlgroup();
    var height = document.body.clientHeight - $("#tophead").outerHeight(true) - $("#bar").outerHeight(true);
    $("#map").height(height); //设置地图窗口高度
    $("#accordion").height(height); //设置图层管理高度
    $("#layerctl").height("auto"); //设置图层管理高度
}

//随机渲染色
function getrndstopcolor() {
    var lowColor;
    require(["esri/Color"], function (Color) {
        var lowval = 200;
        lowColor = new Color([lowval, lowval, lowval]);
    });
    return [lowColor, createrndcolor(99)];
}

function setZTLyVisible(layerid, visible) {
    //alert('asd');
    map.getLayer(map.graphicsLayerIds[layerid]).setVisibility(visible);
}

function AddQXZTLayer(layername, layertype, xoffset, yoffset, minval, maxval, size) {
    require([
        "esri/map", "esri/layers/FeatureLayer", "esri/renderers/SimpleRenderer", "esri/symbols/PictureMarkerSymbol",
        "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol", "esri/Color", "esri/symbols/TextSymbol", "esri/layers/LabelClass",
        "dojo/domReady!"
    ], function (
        Map, FeatureLayer, SimpleRenderer, PictureMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, Color, TextSymbol, LabelClass
    ) {
        if (layertype == 2) picurl = 'pic/' + layername + '.png';
        var filterstr = '';
        //生成底色图层
        if (layertype == 1) {
            //色深渲染
            renderer = new SimpleRenderer(new SimpleFillSymbol().setOutline(
                new SimpleLineSymbol().setWidth(0.5).setColor(new Color([0, 0, 0]))));

            renderer.setColorInfo({
                field: layername,
                minDataValue: minval,
                maxDataValue: maxval,
                colors: getrndstopcolor()
            });
        } else { //生成符号渲染器
            renderer = new SimpleRenderer(new PictureMarkerSymbol(picurl, size, size).setOffset(xoffset, 0));
            if (minval != null) filterstr = layername + " > " + minval + " and " + layername + " <= " + maxval;
        }

        featureLayer = new FeatureLayer(qxztURL, {
            showLabels: true,
            definitionExpression: filterstr,
            mode: FeatureLayer.MODE_SNAPSHOT,
            outFields: ["NAME", "AREA_CODE", "renkou", "xiaomai", "yumi", "shijigd", "zhucunlan", "rouniucunlan"],
            opacity: 0.8
        });

        if (layername == 'renkou') {
            //显示标签
            var statesLabel = new TextSymbol(); //.setColor(new Color("RGB(0,0,0)"));
            statesLabel.font.setSize("12pt");
            statesLabel.font.setFamily("微软雅黑");
            statesLabel.setOffset(0, -30);
            var json = {
                "labelExpressionInfo": {
                    "value": "{NAME}"
                }
            };
            var labelClass = new LabelClass(json);
            labelClass.symbol = statesLabel; // symbol also can be set in LabelClass' json
            featureLayer.setLabelingInfo([labelClass]);
        }
        featureLayer.setRenderer(renderer);
        map.addLayer(featureLayer);
        CreatePopup(featureLayer, '人口数,renkou;耕地面积,shijigd;小麦面积,xiaomai;玉米面积,yumi;生猪养殖,zhucunlan;');

        //toply = featureLayer;
    });

}

function LoadCUNMap(tbname, zbname, zbali, rendertype, maptitle) {
    //设置标题
    $('#maptitle').text(maptitle);
    //先做SDE数据准备
    zbnamestr = zbname + ',';
    if (rendertype == '1') {
        for (var i = 0; i < basezbnames.length; i++) {
            if (zbname != basezbnames[i]) {
                zbnamestr += basezbnames[i] + ",";
            }
        }
    }

    url = encodeURI("UpdateSDE_CUN.aspx?tbname=" + tbname + "&zbname=" + zbnamestr);
    $.get(url, function (val) {
        showmap(eval('(' + val + ')').min, eval('(' + val + ')').max, rendertype, zbname, zbali, maptitle);
    });
}

var densityLayer;

function SetDensityVisible(lyno) {
    if (lyno != null) {
        densityLayer.setVisibleLayers([0,1,lyno+2]);
        lylegend.refresh();
    }
}


function GenerateID(str) {
    var pad = "00"
    return pad.substring(0, pad.length - str.length) + str
}

function showmap(min, max, rendertype, zbname, zbali, maptitle) {
    var legend;
    var zbnamestr;
    var zbnames = new Array();
    var zbunits = new Array();

    var agoLayer;
    var featureLayer;

    require([
        "esri/map", "dojo/parser",
        "esri/dijit/PopupTemplate", "esri/layers/FeatureLayer", "esri/InfoTemplate", "esri/dijit/Legend",
        "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol",
        "esri/toolbars/draw", "esri/tasks/GeometryService", "esri/config",
        "esri/geometry/Extent", "esri/renderers/SimpleRenderer", "esri/renderers/UniqueValueRenderer",
        "esri/Color", "esri/layers/ArcGISDynamicMapServiceLayer",
        "esri/symbols/TextSymbol", "esri/layers/LabelClass",
        "dojo/number", "dojo/dom-style",
        "dijit/TooltipDialog", "dijit/popup", "esri/graphic", "esri/lang",
        "dojo/domReady!"
    ], function (
        Map, parser, PopupTemplate, FeatureLayer, InfoTemplate, Legend,
        SimpleLineSymbol, SimpleFillSymbol,
        Draw, GeometryService, esriConfig,
        Extent, SimpleRenderer, UniqueValueRenderer,
        Color, ArcGISDynamicMapServiceLayer, TextSymbol, LabelClass, number, domStyle,
        TooltipDialog, dijitPopup, Graphic, esriLang
    ) {

        //处理指标名称
        zbnames.push(zbali);
        for (var i = 0; i < basezbnames.length; i++) {
            if (zbname == basezbnames[i]) {
                zbunits.push(basezbunits[i]);
            }
        }
        if (rendertype == '1') {
            var idx = 2;
            for (var i = 0; i < basezbnames.length; i++) {
                if (zbname != basezbnames[i]) {
                    zbnames.push(basezbnames[i]);
                    zbunits.push(basezbunits[i]);
                    idx++;
                }
            }
        }

        //渲染地图
        RenderMap();

        function RenderMap() {
            var dzm = '3708';
            var arealvl = 4; //村级图层
            if (featureLayer != null)
                map.removeLayer(featureLayer);


            var namefield = "NAME";
            var keyfield = "cmd01";

            //生成渲染器
            function CreateRender() {
                var render;
                if (rendertype == '1') {
                    //色深渲染
                    renderer = new SimpleRenderer(new SimpleFillSymbol().setOutline(
                        new SimpleLineSymbol().setWidth(0.5).setColor(new Color([0, 0, 0]))));

                    renderer.setColorInfo({
                        field: keyfield,
                        minDataValue: min,
                        maxDataValue: max,
                        colors: getrndstopcolor()
                    });
                } else //分类渲染
                {
                    var defaultSymbol = new SimpleFillSymbol().setStyle(SimpleFillSymbol.STYLE_NULL);
                    defaultSymbol.outline.setStyle(SimpleLineSymbol.STYLE_NULL);
                    //create renderer
                    renderer = new UniqueValueRenderer(defaultSymbol, 'cmd01');
                    var valstr = rendertype.substring(2);
                    var vals = new Array();
                    vals = valstr.split(",");
                    for (var i = 0; i < vals.length; i++) {
                        renderer.addValue(vals[i], new SimpleFillSymbol().setColor(createrndcolor(i)));
                    }
                }
                return renderer;
            }
            //创建图层
            function CreateLayer(renderer) {
                var url = "";
                url = agoServiceURL + (arealvl - 1);

                featureLayer = new FeatureLayer(url, {
                    showLabels: false,
                    //definitionExpression:"AREA_CODE like '370811%'",
                    mode: FeatureLayer.MODE_SNAPSHOT,
                    outFields: [namefield, "AREA_CODE", "cmd01", "cmd02", "cmd03", "cmd04", "cmd05"],
                    opacity: 0.8
                });
                featureLayer.setRenderer(renderer);
            }

            render = CreateRender();
            CreateLayer(render);

            //信息窗格式
            var popupTemplateUpdated = new PopupTemplate({
                title: "{NAME}",
                fieldInfos: [{
                    "fieldName": "cmd01",
                    "label": zbali,
                    "visible": true
                }],
                showAttachments: false
            });
            featureLayer.setInfoTemplate(popupTemplateUpdated);

            //添加图层
            if (agoLayer != null)
                map.removeLayer(agoLayer);
            map.addLayer(featureLayer);
            //图层加载完毕关闭进度条
            featureLayer.on("update-end", function (evt) {
                $('#myModal').modal('hide');
            });

            //叠加区县边界
            qxlayer = new FeatureLayer(agoServiceURL + "1", {
                showLabels: true,
                mode: FeatureLayer.MODE_SNAPSHOT,
                outFields: ["NAME"]
            });
            var qxsymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                    new Color([0, 0, 255]), 1), new Color([0, 0, 0, 0])
            );
            //qxsymbol.setOutline(new SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new Color([255, 0, 0]), 2));

            var renderer = new SimpleRenderer(qxsymbol);
            qxlayer.setRenderer(renderer);
            map.addLayer(qxlayer);

            //显示图例
            if (legend == null) {
                legend = new Legend({
                    map: map,
                    layerInfos: [{
                        title: maptitle,
                        layer: featureLayer
                    }]
                }, "legend");
            }

            legend.startup();
            legend.refresh();

            //空间查询
            //设置选中要素样式
            var symbol = new SimpleFillSymbol(
                SimpleFillSymbol.STYLE_SOLID,
                new SimpleLineSymbol(
                    SimpleLineSymbol.STYLE_SOLID,
                    new Color([0, 255, 0]),
                    1
                ),
                new Color([255, 0, 0])
            );

            featureLayer.setSelectionSymbol(symbol);

            //初始化工具
            //parser.parse();
            esriConfig.defaults.io.proxyUrl = "/proxy/";
            //This service is for development and testing purposes only. We recommend that you create your own geometry service for use within your applications.
            esriConfig.defaults.geometryService = new GeometryService("https://utility.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");

            drawToolbar = new esri.toolbars.Draw(map);
            var selectQuery = new esri.tasks.Query();

            //绘制多边形按钮事件
            $('#reshape').click(function () {
                if ($('#reshape').text() == '空间查询') {
                    drawToolbar.activate(esri.toolbars.Draw.FREEHAND_POLYGON);
                    $('#reshape').text('关闭查询');
                } else {
                    drawToolbar.deactivate();
                    $('#reshape').text('空间查询');
                }
                return false;
            });

            //绘制完毕，执行查询
            dojo.connect(drawToolbar, "onDrawEnd", function (geometry) {
                selectQuery.geometry = geometry;
                selectQuery.outFields = ["NAME", "cmd01", "cmd02", "cmd03", "cmd04", "cmd05"];
                featureLayer.selectFeatures(selectQuery, FeatureLayer.SELECTION_NEW, function (features) {
                    var total = new Array();
                    for (izb = 0; izb < zbnames.length; izb++)
                        total[izb] = 0;
                    for (i = 0; i < features.length; i++) {
                        for (izb = 0; izb < zbnames.length; izb++)
                            total[izb] += eval('features[i].attributes.cmd' + GenerateID((izb + 1).toString()));
                    }
                    r = "<b>查询范围内有村居<font color='red'>" + features.length + "</font>个<br/>";
                    var zbstr = '';
                    for (izb = 0; izb < zbnames.length; izb++) {
                        var units = '';
                        if (zbunits[izb])
                            units = zbunits[izb];
                        zbstr += zbnames[izb] + ":<font color='blue'>" + Math.round(total[izb] * 100) / 100 +
                            units + "</font><br/>";
                    }
                    r += zbstr + '</b>';
                    $("#querytext").html(r);
                });
            });
        }
    });


}

function CreateFlowInfo(zbnamestr) {
    require([
        "esri/layers/FeatureLayer",
        "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol",
        "esri/renderers/SimpleRenderer",
        "esri/Color", "esri/layers/ArcGISDynamicMapServiceLayer",
        "dijit/TooltipDialog", "dijit/popup", "esri/lang", "esri/graphic", "dojo/dom-style"
    ], function (
        FeatureLayer,
        SimpleLineSymbol, SimpleFillSymbol,
        SimpleRenderer,
        Color, ArcGISDynamicMapServiceLayer,
        TooltipDialog, dijitPopup, esriLang, Graphic, domStyle
    ) {
        //响应鼠标事件，处理飘窗
        map.on("load", function () {
            map.graphics.enableMouseEvents();
            map.graphics.on("mouse-out", closeDialog);

        });
        //数据飘窗
        dialog = new TooltipDialog({
            id: "tooltipDialog",
            style: "position: absolute; width: 250px; font: normal normal normal 10pt Helvetica;z-index:100"
        });
        dialog.startup();

        function closeDialog() {
            map.graphics.clear();
            dijitPopup.close(dialog);
        }

        //鼠标悬浮激活的要素显示格式
        var highlightSymbol = new SimpleFillSymbol(
            SimpleFillSymbol.STYLE_SOLID,
            new SimpleLineSymbol(
                SimpleLineSymbol.STYLE_SOLID,
                new Color([255, 0, 0]), 3
            ),
            new Color([125, 125, 125, 0.35])
        );
        //飘窗数据格式
        var infostr = "";
        var zbstr = new Array();

        zbstr = zbnamestr.split(";");
        for (var i = 0; i < zbstr.length; i++) {
            if (zbstr[i] == '') break;
            var zba = new Array();
            zba = zbstr[i].split(",");
            infostr += "<b>" + zba[0] + "</b>：${" + zba[1] + "}<br>";
        }
        

        //响应鼠标移动，激活飘窗
        map.on("mouse-over", function (evt) {
            var t = "<b>${NAME}</b><hr><b>" + infostr;
            var content = '';

            if (evt.graphic != undefined && evt.graphic.attributes != undefined) {
                var content = esriLang.substitute(evt.graphic.attributes, t);

                var highlightGraphic = new Graphic(evt.graphic.geometry, highlightSymbol);
                map.graphics.add(highlightGraphic);

                dialog.setContent(content);

                domStyle.set(dialog.domNode, "opacity", 0.85);
                dijitPopup.open({
                    popup: dialog,
                    x: evt.pageX,
                    y: evt.pageY
                });
            }
        });
    });
}

function CreatePopup(flay, zbnamestr) {
    require([
        "esri/dijit/PopupTemplate"
    ], function (
        PopupTemplate
    ) {
        vfieldinfos = new Array;
        //数据格式
        var infostr = "";
        var zbstr = new Array();

        zbstr = zbnamestr.split(";");
        for (var i = 0; i < zbstr.length; i++) {
            if (zbstr[i] == '') break;
            var zba = new Array();
            zba = zbstr[i].split(",");
            vfieldinfos.push({
                fieldName: zba[1],
                label: zba[0],
                visible: true
            });
        }
        //信息窗格式
        var popupTemplateUpdated = new PopupTemplate({
            title: "{NAME}",
            fieldInfos: vfieldinfos,
            showAttachments: false
        });
        flay.setInfoTemplate(popupTemplateUpdated);
    });
}

function CreateGEOTool(zbnamestr, zbs) {
    require([
            "esri/layers/FeatureLayer", "esri/InfoTemplate",
            "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol",
            "esri/toolbars/draw", "esri/tasks/GeometryService", "esri/config",
            "esri/geometry/Extent", "esri/renderers/SimpleRenderer",
            "esri/Color", "esri/layers/ArcGISDynamicMapServiceLayer",
            "dojo/domReady!"
        ],
        function (
            FeatureLayer, InfoTemplate,
            SimpleLineSymbol, SimpleFillSymbol,
            Draw, GeometryService, esriConfig,
            Extent, SimpleRenderer,
            Color, ArcGISDynamicMapServiceLayer) {
            //空间查询图层
            var featureLayer;
            var url = "http://"+serverip+":6080/arcgis/rest/services/lwbj/MapServer/9";

            featureLayer = new FeatureLayer(url, {
                //infoTemplate: new InfoTemplate("&nbsp;", "${NAME}"),
                mode: FeatureLayer.MODE_SNAPSHOT,
                outFields: zbnames,
                opacity: 0.8
            });

            featureLayer.setShowLabels(false);

            var nullSymbol = new SimpleFillSymbol(
                SimpleFillSymbol.STYLE_SOLID,
                new SimpleLineSymbol(
                    SimpleLineSymbol.STYLE_SOLID,
                    new Color([0, 0, 0, 0]),
                    0
                ),
                new Color([0, 0, 0, 0])
            );

            featureLayer.setRenderer(new SimpleRenderer(nullSymbol));
            //设置选中要素样式
            var symbol = new SimpleFillSymbol(
                SimpleFillSymbol.STYLE_SOLID,
                new SimpleLineSymbol(
                    SimpleLineSymbol.STYLE_SOLID,
                    new Color([0, 255, 0]),
                    1
                ),
                new Color([255, 0, 0])
            );

            featureLayer.setSelectionSymbol(symbol);
            map.addLayer(featureLayer);
            //初始化工具
            //parser.parse();
            esriConfig.defaults.io.proxyUrl = "/proxy/";
            //This service is for development and testing purposes only. We recommend that you create your own geometry service for use within your applications.
            esriConfig.defaults.geometryService = new GeometryService("https://utility.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");

            drawToolbar = new esri.toolbars.Draw(map);
            var selectQuery = new esri.tasks.Query();

            //绘制多边形按钮事件
            $('#reshape').click(function () {
                if ($('#reshape').text() == '空间查询') {
                    drawToolbar.activate(esri.toolbars.Draw.FREEHAND_POLYGON);
                    $('#reshape').text('关闭查询');
                } else {
                    drawToolbar.deactivate();
                    $('#reshape').text('空间查询');
                }
                return false;
            });

            //绘制完毕，执行查询
            dojo.connect(drawToolbar, "onDrawEnd", function (geometry) {
                selectQuery.geometry = geometry;
                selectQuery.outFields = zbnames;
                featureLayer.selectFeatures(selectQuery, FeatureLayer.SELECTION_NEW, function (features) {
                    var total = new Array();
                    for (izb = 0; izb < zbnames.length; izb++)
                        total[izb] = 0;
                    for (i = 0; i < features.length; i++) {
                        for (izb = 0; izb < zbnames.length; izb++)
                            total[izb] += features[i].attributes[zbnames[izb]];
                    }
                    r = "<b>查询范围内有村居<font color='red'>" + features.length + "</font>个<br/>";
                    var zbstr = '';
                    for (izb = 0; izb < zbnames.length; izb++) {
                        var units = '';
                        if (zbunits[izb])
                            units = zbunits[izb];
                        zbstr += zbalias[izb] + ":<font color='blue'>" + Math.round(total[izb] * 100) / 100 +
                            units + "</font><br/>";
                    }
                    r += zbstr + '</b>';
                    $("#querytext").html(r);
                });
            });
        });
}
var lylegend;

function CreateLegend(mapctl, maptitle, featureLayer, onlyfirst) {
    require([
        "esri/dijit/Legend"
    ], function (
        Legend
    ) {
        //显示图例
        if (lylegend == null && onlyfirst) {
            lylegend = new Legend({
                map: mapctl,
                layerInfos: [{
                    title: maptitle,
                    layer: featureLayer
                }]
            }, "legend");


            lylegend.startup();
            lylegend.refresh();
        }

    });
}