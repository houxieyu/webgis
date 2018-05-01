$(function () {
    //先做SDE数据准备
    $.get("UpdateSDEBySupporting.aspx", function (val) {
        //初始化图表
        InitChart();
        //挂载市级数据
        LoadData('3708',1);
        //渲染地图
        var height = $("#leftpanel").height();
        $("#map").height(height);//直接设置元素的高
        $("#griddiv").height(height);//直接设置元素的高
        showmap(eval('('+val+')').min, eval('('+val+')').max);
    });
});

function LoadData(dzm,type)
{
    //加载数据
    $.get("GetMPIDataForJson.aspx?dd="+Math.random()+"&dzm="+dzm+"&dzcs="+type, function success(data) {
        //显示图表
        var mpidata = eval('('+data+')');
        BindChartData(mpidata);
        //显示数据网格
        $('#submpigrid').datagrid({
            data: mpidata.subMPI,
            url:null
        });
        //$('#submpigrid').datagrid('reload');
    })
}

function BindChartData()
{
    //预警仪表盘
    option_yj.series[0].name = mpidata.totalMPI[0].AreaName+'MPI指数';
    option_yj.series[0].data = [{ value: mpidata.totalMPI[0].MPI, name:mpidata.totalMPI[0].AreaName+ 'MPI指数' }];
    //mpi柱图
    option_zt.series[0].data = [mpidata.totalMPI[0].Shouru, mpidata.totalMPI[0].Jiaoyu, mpidata.totalMPI[0].Jiankang,
                                mpidata.totalMPI[0].Shenghuo, mpidata.totalMPI[0].Baoxian];
    //mpi结构图
    option_bt.series[0].data = [
                               { value: mpidata.totalMPI[0].Shouru, name: zbnames[0] },
                               { value: mpidata.totalMPI[0].Jiaoyu, name: zbnames[1] },
                                   { value: mpidata.totalMPI[0].Jiankang, name: zbnames[2] },
                                   { value: mpidata.totalMPI[0].Shenghuo, name: zbnames[3] },
                                   { value: mpidata.totalMPI[0].Baoxian, name: zbnames[4] }
    ];
    // 使用刚指定的配置项和数据显示图表。
    Chart_yj.setOption(option_yj);
    Chart_zt.setOption(option_zt);
    Chart_bt.setOption(option_bt);
}

// echarts全局对象，保存图表和设置
var zbnames = ["收入", "教育", "健康", "生活", "社保"];
var Chart_yj ;
var Chart_zt ;
var Chart_bt ;
var option_yj;
var option_zt;
var option_bt;

var Chart_areazt;
var option_areazt;
function InitChart()
{
    // 基于准备好的dom，初始化echarts实例
    //Chart_yj = echarts.init(document.getElementById('chart_mpiyj'));
    //Chart_zt = echarts.init(document.getElementById('chart_mpizt'));
    //Chart_bt = echarts.init(document.getElementById('chart_mpibt'));
    Chart_yj = echarts.init(document.getElementById('chart_mpiyj'), 'shine');
    Chart_zt = echarts.init(document.getElementById('chart_mpizt'), 'shine');
    Chart_bt = echarts.init(document.getElementById('chart_mpibt'), 'shine');
    //Chart_areazt = echarts.init(document.getElementById('chart_areazt'));
    // 指定图表的配置项和数据
    //预警仪表盘
    option_yj = {
        tooltip: {
            formatter: "{a} <br/>{b} : {c}"
        },
        toolbox: {
            feature: {
            }
        },
       // backgroundColor: '#DDA0DD',
        series: [
            {
                name: 'MPI指数',
                type: 'gauge',
                min: 0,
                max: 1,
                radius: '100%',
                detail: { formatter: '{value}' },
                data: [{ value: 758, name: 'MPI指数' }]
            }
        ]
    };
    //mpi柱图
    option_zt = {
        title: {
            text: 'MPI指标'
        },
        tooltip: {},
        legend: {
            data: ['MPI']
        },
        xAxis: {
            data: zbnames
        },
        yAxis: {},
        //backgroundColor: '#dd5be2',
        series: [{
            name: 'MPI',
            type: 'bar',
            data: [5, 20, 36, 10, 10]
        }]
    };
    //mpi饼图
    option_bt = {
        tooltip: {
            trigger: 'item',
            formatter: "{a} <br/>{b}: {c} ({d}%)"
        },
        legend: {
            orient: 'horizontal',
            x: 'left',
            data: zbnames
        },
        //backgroundColor: '#eaeb6c',
        series: [
            {
                name: 'MPI指数构成',
                type: 'pie',
                radius: ['50%', '70%'],
                avoidLabelOverlap: false,
                label: {
                    normal: {
                        show: false,
                        position: 'center'
                    },
                    emphasis: {
                        show: true,
                        textStyle: {
                            fontSize: '30',
                            fontWeight: 'bold'
                        }
                    }
                },
                labelLine: {
                    normal: {
                        show: false
                    }
                },
                data: [
                    { value: 335, name: '收入' },
                    { value: 310, name: '教育' },
                    { value: 234, name: '健康' },
                    { value: 135, name: '生活' },
                    { value: 1548, name: '保险' }
                ]
            }
        ]
    };

}

    var map;
function showmap(min,max) {
    var legend;

    var zbnamestr;
    var agoServiceURL = "http://124.133.27.90:6080/arcgis/rest/services/JINING/NP3/MapServer/";
    var basemapURL = "http://124.133.27.90:6080/arcgis/rest/services/JINING/JININGmap/MapServer";
    var agoLayer;
    var featureLayer;

    require([
      "esri/map", "esri/dijit/PopupTemplate", "esri/layers/FeatureLayer", "esri/InfoTemplate", "esri/dijit/Legend",
      "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol",
      "esri/geometry/Extent", "esri/renderers/SimpleRenderer",
      "esri/Color", "esri/layers/ArcGISDynamicMapServiceLayer", "esri/symbols/TextSymbol", "esri/layers/LabelClass",
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
            zoom: 9,
            slider: false,
            center: [116.7, 35.4],
            showLabels: true
        });
        agoLayer = new ArcGISDynamicMapServiceLayer(basemapURL, { "opacity": 0.5 });
        //map.addLayer(agoLayer);

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

        RenderMap();
        function RenderMap() {

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
            if (featureLayer != null)
                map.removeLayer(featureLayer);

            zbnamestr = 'MPI指数,cmd01;收入,cmd02;教育,cmd03;健康,cmd04;生活,cmd05;保险,cmd06';

            var namefield = "NAME";
            var keyfield = "cmd01";

            function CreateRender() {
                var renderer = new SimpleRenderer(new SimpleFillSymbol().setOutline(
                    new SimpleLineSymbol().setWidth(1).setColor(new Color([0, 0, 0]))));

                var renderColor;
                var lowColor;
                renderColor = new Color([50, 0, 50]);
                lowColor = new Color([255, 0, 255]);

                renderer.setColorInfo({
                    field: keyfield,
                    minDataValue: min,
                    maxDataValue: max,
                    colors: [lowColor, renderColor]
                });
                return renderer;
            }
            function CreateLayer(renderer) {
                var url = "";
                url = agoServiceURL + (arealvl - 1);

                featureLayer = new FeatureLayer(url, {
                    mode: FeatureLayer.MODE_SNAPSHOT,
                    outFields: [namefield, "AREA_CODE", "cmd01", "cmd02", "cmd03", "cmd04", "cmd05", "cmd06"],
                    opacity: 0.8,
                    showLabels: true
                });
                featureLayer.setRenderer(renderer);

                //显示标签
                var statesLabel = new TextSymbol();//.setColor(new Color("RGB(0,0,0)"));
                statesLabel.font.setSize("12pt");
                statesLabel.font.setFamily("微软雅黑");
                var json = {
                    "labelExpressionInfo": { "value": "{NAME}" }
                };
                var labelClass = new LabelClass(json);
                labelClass.symbol = statesLabel; // symbol also can be set in LabelClass' json
                featureLayer.setLabelingInfo([labelClass]);
            }

            render = CreateRender();
            CreateLayer(render);

            var infostr = "";
            var zbstr = new Array();
            zbstr = zbnamestr.split(";");
            for (var i = 0; i < zbstr.length; i++) {
                var zba = new Array();
                zba = zbstr[i].split(",");
                infostr += "<b>" + zba[0] + "</b>：${" + "cmd" + GenerateID((i + 1).toString()) + "}<br>";
                //alert(GenerateID((i + 1).toString()));
            }
            function GenerateID(str) {
                var pad = "00"
                return pad.substring(0, pad.length - str.length) + str
            }

            var popupTemplateUpdated = new PopupTemplate({
                title: "{NAME}",
                fieldInfos: [
                    {
                    "fieldName": "cmd01",
                    "label": 'MPI指数',
                    "visible": true
                    }
                    //,
                    //{
                    //    "fieldName": "cmd02",
                    //    "label": zbnames[0],
                    //    "visible": true
                    //},
                    //{
                    //    "fieldName": "cmd03",
                    //    "label": zbnames[1],
                    //    "visible": true
                    //},
                    //{
                    //    "fieldName": "cmd04",
                    //    "label": zbnames[2],
                    //    "visible": true
                    //},
                    //{
                    //    "fieldName": "cmd05",
                    //    "label": zbnames[3],
                    //    "visible": true
                    //},
                    //{
                    //    "fieldName": "cmd06",
                    //    "label": zbnames[4],
                    //    "visible": true
                    //}
                ],
                showAttachments: false
            });
            //featureLayer.setInfoTemplate(popupTemplateUpdated);

            if (legend == null) {
                legend = new Legend({
                    map: map,
                    layerInfos: [{ title: "MPI专题：", layer: featureLayer }]
                }, "legend");
            }
            //addQXBJLayer();
            if (agoLayer != null)
                map.removeLayer(agoLayer);
            map.addLayer(featureLayer);


            map.on("click", function (evt) {
                    try{
                        if (evt.graphic == null)
                            LoadData('3708',1);
                        else if (evt.graphic.attributes['AREA_CODE'] != null)
                            LoadData(evt.graphic.attributes['AREA_CODE'], 1);
                        else LoadData(evt.graphic.symbol.text, 2);
                    }
                    catch (e) {
                        LoadData(evt.graphic.symbol.text, 2);
                    }
            });

            //map.on("click", function (evt) {
            //    try{
            //        if (evt.graphic == null || evt.graphic.attributes['AREA_CODE'] == null)
            //            LoadData('3708');
            //        else LoadData(evt.graphic.attributes['AREA_CODE']);
            //    }
            //    catch (e) {
            //        LoadData('3708');
            //    }
            //});


            //featureLayer.on("mouse-over", function (evt) {
            //    var t = "<b>${NAME}</b><hr><b>" + infostr;
            //    var content = esriLang.substitute(evt.graphic.attributes, t);
            //    var highlightGraphic = new Graphic(evt.graphic.geometry, highlightSymbol);
            //    map.graphics.add(highlightGraphic);

            //    dialog.setContent(content);

            //    domStyle.set(dialog.domNode, "opacity", 0.85);
            //    dijitPopup.open({
            //        popup: dialog,
            //        x: evt.pageX,
            //        y: evt.pageY
            //    });
            //});

            legend.startup();
            legend.refresh();

        }
    });

 
    }
var agoServiceURL = "http://124.133.27.90:6080/arcgis/rest/services/JINING/NP3/MapServer/";
//叠加区县边界
function addQXBJLayer() {
    require([
 "esri/layers/FeatureLayer", "esri/renderers/SimpleRenderer",
"esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol", "esri/Color"
    ], function (
 FeatureLayer, SimpleRenderer, SimpleLineSymbol, SimpleFillSymbol, Color
) {
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