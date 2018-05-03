    // var serverip;
    // $.ajaxSettings.async = false; 
    // $.getJSON("../Scripts/serverip.json", function (result){
    //     console.log(result);
    //     serverip = result.ip;
    // });
var featureURL = "http://"+serverip+"/arcgis/rest/services/lwbj/MapServer/";
var basemapURL = "http://"+serverip+"/arcgis/rest/services/lwbj/MapServer";
var map;
var featureLayer;
var datas;
var curdzm = '37121';
var curdq = '莱芜市';
var seldzm = '37121';
var seldq = '莱芜市';
var fatherdzm = '37';
var fatherdq = '山东';
var curField;
var zbLists = [{
        name: "农民生活水平",
        data: ["农业人口数", "小汽车", "摩托电瓶车", "沐浴热水器", "空调", "电冰箱", "电视机", "电脑", "手机", "上网手机"]
    },
    {
        name: "种植业",
        data: ["农业人口数", "玉米播种面积", "小麦播种面积", "马铃薯播种面积", "蔬菜播种面积", "生姜播种面积", "大蒜播种面积"]
    },
    {
        name: "林业",
        data: ["农业人口数", "苹果种植面积", "梨种植面积", "红枣种植面积", "桃种植面积", "葡萄种植面积"]
    },
    {
        name: "畜牧业",
        data: ["农业人口数", "肉牛年末存栏", "生猪年末存栏", "绵羊年末存栏", "山羊年末存栏", "肉鸡年末存栏"]
    },
    {
        name: "渔业",
        data: ["农业人口数", "淡水养殖面积", "池塘养殖面积", "渔业机动船"]
    }
];
var zbList;
var title;
var qxdzmlist = [];
var colortypes = 1;

//获取url中的参数
function getQueryString(name) {
    var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
    var r = window.location.search.substr(1).match(reg);
    if (r != null) {
        return unescape(r[2]);
    }
    return 0;
}

function UpdateView() {
    UpdateChart();
}

function UpdateChart() {
    var curFielddb;
    curFielddb = curField;
    //总量对比图
    option_db.series[0].name = curField;
    option_db.series[0].data = [];
    option_db.xAxis.data = [];
    for (var i = 0; i < datas.length; i++) {
        if (datas[i][curFielddb] == null) continue;
        option_db.series[0].data.push(datas[i][curFielddb]);
        option_db.xAxis.data.push(datas[i]['地区']);
    }
    option_db.title.text = curdq + '分地区' + curField + '总量对比';
    if (curdzm.length > 6) {
        option_db.xAxis.axisLabel.rotate = -90;
    } else option_db.xAxis.axisLabel.rotate = 0;
    //人均对比图
    option_rj.series[0].name = curField;
    option_rj.series[0].data = [];
    option_rj.xAxis.data = [];
    for (var i = 0; i < datas.length; i++) {
        if (datas[i][curFielddb] == null) continue;
        option_rj.series[0].data.push((datas[i][curFielddb] * 1.0 / datas[i]['农业人口数']).toFixed(2));
        option_rj.xAxis.data.push(datas[i]['地区']);
    }
    option_rj.title.text = curdq + '分地区' + curField + '人均对比';
    if (curdzm.length > 6) {
        option_rj.xAxis.axisLabel.rotate = -90;
    } else option_rj.xAxis.axisLabel.rotate = 0;
    //垂直柱图
    option_cur.title.text = seldq + '相关指标';
    option_cur.series[0].name = seldq;
    option_cur.series[0].data = [];
    seldzm = getAreaTrim(seldzm);
    if (curdzm != seldzm) {
        for (var i = 0; i < datas.length; i++) {
            if (datas[i]['区划码'] == seldzm) {
                for (var j = 0; j < zbList.length; j++) {
                    option_cur.series[0].data.push(datas[i][zbList[j]]);
                }
            }
        }
    } else {
        for (var j = 0; j < zbList.length; j++) {
            option_cur.series[0].data[j] = 0;
        }
        for (var i = 0; i < datas.length; i++) {
            for (var j = 0; j < zbList.length; j++) {
                option_cur.series[0].data[j] += parseFloat(datas[i][zbList[j]]);
            }
        }
        for (var j = 0; j < zbList.length; j++) {
            if (option_cur.series[0].data[j].toString().length > 10)
                option_cur.series[0].data[j] = option_cur.series[0].data[j].toFixed(2);
        }
    }
    //排名图
    option_pm.parallelAxis[0].data = [];
    option_pm.series[0].data = [];
    for (var i = 0; i < datas.length; i++) {
        if (datas[i]['农业人口数'] == null)
            continue;
        option_pm.parallelAxis[0].data.push(datas[i]['地区']);
        var row = new Array();
        row.push(datas[i]['地区']);
        for (var j = 0; j < zbList.length; j++) {
            row.push(datas[i][zbList[j]]);
        }
        option_pm.series[0].data.push(row);
    }
    option_pm.visualMap.max = GetMinMax('农业人口数').max;
    chart_db.setOption(option_db);
    chart_cur.setOption(option_cur);
    chart_rj.setOption(option_rj);
    chart_pm.setOption(option_pm);
}

function InitChart() {
    // 基于准备好的dom，初始化echarts实例
    chart_db = echarts.init(document.getElementById('chart_db'), 'shine');
    chart_rj = echarts.init(document.getElementById('chart_rj'), 'shine');
    chart_cur = echarts.init(document.getElementById('chart_cur'), 'shine');
    chart_pm = echarts.init(document.getElementById('chart_pm'), 'shine');
    // 指定图表的配置项和数据
    //总量对比图
    option_db = {
        grid: {
            left: '12%',
            right: '0%',
            bottom: '8%',
            top: '15%'
        },
        title: {
            text: curField,
            left: 'center'
        },
        tooltip: {},
        //legend: {
        //    data: [curField]
        //},
        xAxis: {
            data: [],
            axisLabel: {
                interval: 0,
                rotate: -0
            }
        },
        yAxis: {},
        series: [{
            name: curField,
            type: 'bar'
        }],
        label: {
            normal: {
                show: true,
                position: 'insideTop'
            }
        },
        color: ['#005eaa']
    };
    //人均对比图
    option_rj = {
        grid: {
            right: '0%',
            bottom: '8%',
            top: '15%'
        },
        title: {
            text: curField,
            left: 'center'
        },
        tooltip: {},
        //legend: {
        //    data: [curField]
        //},
        xAxis: {
            data: [],
            axisLabel: {
                interval: 0,
                rotate: -0
            }
        },
        yAxis: {},
        series: [{
            name: curField,
            type: 'bar'
        }],
        label: {
            normal: {
                show: true,
                position: 'insideTop'
            }
        },
        color: ['#2f4554']
    };
    //垂直柱图
    option_cur = {
        title: {
            text: seldq,
            left: 'center'
        },
        tooltip: {},
        xAxis: {
            type: 'value',
            data: []
        },
        yAxis: {
            type: 'category',
            data: zbList,
            inverse: true
        },
        series: [{
            name: seldq,
            type: 'bar'
        }],
        grid: {
            left: '-1%',
            right: '0%',
            bottom: '0%',
            top: '8%',
            containLabel: true
        },
        label: {
            normal: {
                show: true,
                position: 'right'
            }
        }

        //color: ['#E01F54']
    };
    //排名图
    var lineStyle = {
        normal: {
            width: 2,
            opacity: 1
        }
    };
    option_pm = {

        //backgroundColor: '#333',
        visualMap: {
            show: false,
            min: 0,
            max: 600000,
            dimension: 1,
            inRange: {
                color: ['#d94e5d', '#eac736', '#50a3ba'].reverse()
                //symbolSize:[2,20]
                // colorAlpha: [0, 1]
            }
        },
        parallel: {
            top: '12%',
            left: '8%',
            right: '8%',
            bottom: '5%',
            //bottom: 100,
            parallelAxisDefault: {
                type: 'value',
                name: '地区',
                nameLocation: 'start',
                nameGap: 20,
                nameTextStyle: {
                    fontSize: 12
                },
                axisLine: {
                    lineStyle: {
                        // color: '#aaa'
                    }
                },
                axisTick: {
                    lineStyle: {
                        // color: '#777'
                    }
                },
                splitLine: {
                    show: false
                },
                axisLabel: {
                    textStyle: {
                        // color: '#fff'
                    }
                }
            }
        },
        parallelAxis: [],
        series: [{
            name: '地区排名',
            type: 'parallel',
            lineStyle: lineStyle,
            data: []
        }]
    };
    option_pm.parallelAxis = [];
    option_pm.parallelAxis.push({
        dim: 0,
        name: '地区',
        inverse: true,
        nameLocation: 'start',
        data: [],
        axisLabel: {
            margin: -40
        },
        type: 'category'
    });
    for (var i = 0; i < zbList.length; i++) {
        option_pm.parallelAxis.push({
            dim: i + 1,
            name: zbList[i],
            inverse: false,
            nameLocation: 'end'
        });
    }
}

function InitMap(mapid, addstr, bAddLayer) {
    var mapoption = {
        basemap: "osm",
        zoom: 10,
        slider: false,
        center: [116.7, 35.4],
        showLabels: true
    };
    var opacity = 0.5;
    var mapurl = basemapURL;

    //显示底图
    require([
        "esri/map", "esri/layers/ArcGISDynamicMapServiceLayer"
    ], function (Map, ArcGISDynamicMapServiceLayer) {
        map = new Map(mapid, mapoption);
        agoLayer = new ArcGISDynamicMapServiceLayer(basemapURL, {
            "opacity": opacity
        });

        map.on("load", function () {
            map.graphics.enableMouseEvents();
            map.graphics.on("mouse-out", function (evt) {
                //   if(evt.graphic)console.log(evt.graphic)
                //   else console.log(evt);
                map.graphics.clear();
            });

        });

        if (bAddLayer) {
            AddFeatureLayer('2', '', true);
        }
        //map.addLayer(agoLayer);
    });
}

//下级地区区划码长度
function GetSubLen(dzm) {
    if (dzm.length == 4)
        return 6;
    if (dzm.length == 6)
        return 9;
    if (dzm.length == 9)
        return 12;
}

function FindDzm(dqname) {
    for (var i = 0; i < datas.length; i++) {
        if (datas[i]['地区'] == dqname)
            return datas[i]['区划码'];
    }
    return '';
}

var xqh = {
    '371211': ['371202001', '371202003', '371202103', '371202105', '371202100', '371202101', '371202111'],
    '371212': ['371202004'],
    '371213': ['371202106', '371202107', '371202110'],
    '371214': ['371202002'],
    '371215': ['371202109', '371202108', '371202102']
};
var ssqh = {
    '371202001': '371211',
    '371202003': '371211',
    '371202103': '371211',
    '371202105': '371211',
    '371202100': '371211',
    '371202101': '371211',
    '371202111': '371211',
    '371202004': '371212',
    '371202106': '371213',
    '371202107': '371213',
    '371202110': '371213',
    '371202002': '371214',
    '371202108': '371215',
    '371202109': '371215',
    '371202102': '371215'
}
//加载图层
function AddFeatureLayer(layerno, filterdzm, bRender) {
    require([
        "esri/map", "esri/layers/FeatureLayer", "esri/graphic", "esri/symbols/SimpleLineSymbol",
        "esri/symbols/SimpleFillSymbol", "esri/Color", "esri/tasks/query", "esri/tasks/QueryTask",
        "esri/symbols/TextSymbol", "esri/layers/LabelClass",
        "dojo/domReady!"
    ], function (
        Map, FeatureLayer, Graphic, SimpleLineSymbol, SimpleFillSymbol, Color, Query,QueryTask, TextSymbol, LabelClass
    ) {
        if (featureLayer != null)
            map.removeLayer(featureLayer);
        var wheresql = 'AREA_CODE like \'' + filterdzm + '%\'';
        if (filterdzm == '37121') {
            wheresql = 'AREA_CODE like \'3712%\'';
        } else if (filterdzm.substr(0, 5) == '37121') {
            wheresql = '';
            for (i = 0; i < xqh[filterdzm].length; i++) {
                wheresql += ' AREA_CODE =\'' + xqh[filterdzm][i] + '000\' or';
            }
            wheresql = wheresql.slice(0, -3);
        }

        featureLayer = new FeatureLayer(featureURL + layerno, {
            showLabels: true,
            definitionExpression: wheresql,
            mode: FeatureLayer.MODE_SNAPSHOT,
            outFields: ["NAME", "AREA_CODE"],
            opacity: 0.8
        });
        map.addLayer(featureLayer);
        featureLayer.on('update-end', function () {
            FullExtent();
        });
        //标签样式
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
        //移动高亮
        var highlightSymbol = new SimpleFillSymbol(
            SimpleFillSymbol.STYLE_SOLID,
            new SimpleLineSymbol(
                SimpleLineSymbol.STYLE_SOLID,
                new Color([255, 0, 0]), 3
            ),
            new Color([125, 125, 125, 0])
        );
        map.on("mouse-move", function (evt) {
            if (evt.graphic && !evt.graphic.attributes) {
                //console.log(evt.graphic.symbol.text);
                var name = evt.graphic.symbol.text;
                if (name != '') {
                    var queryTask = new QueryTask(featureURL + layerno );
                    var selectQuery = new Query();
                    selectQuery.outFields=['AREA_CODE','NAME'];
                    selectQuery.where = "NAME = '" + name + "'";
                    selectQuery.returnGeometry  = true;
                    selectQuery.outSpatialReference = map.spatialReference;
                    queryTask.execute(selectQuery,function(result){
                        if(result.features[0]){
                            var highlightGraphic = new Graphic(result.features[0].geometry, highlightSymbol);
                            highlightGraphic.attributes = new Array();
                            highlightGraphic.attributes['AREA_CODE'] =result.features[0].attributes['AREA_CODE'];
                            highlightGraphic.attributes['NAME'] = result.features[0].attributes['NAME'];
                            map.graphics.add(highlightGraphic);
                        }
                    });
                }
            }
        });
        featureLayer.on("mouse-move", function (evt) {
            var highlightGraphic = new Graphic(evt.graphic.geometry, highlightSymbol);
            highlightGraphic.attributes = new Array();
            highlightGraphic.attributes['AREA_CODE'] = evt.graphic.attributes['AREA_CODE'];
            highlightGraphic.attributes['NAME'] = evt.graphic.attributes['NAME'];
            map.graphics.add(highlightGraphic);
        });
        //要素拾取
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
        map.on("click", function (evt) {
            try {
                if (evt.graphic == null) {
                    seldq = curdq;
                    seldzm = curdzm;
                    featureLayer.clearSelection();
                } else if (evt.graphic.attributes != null && evt.graphic.attributes['AREA_CODE'] != null) {
                    seldzm = evt.graphic.attributes['AREA_CODE'].substring(0, GetSubLen(curdzm));
                    seldq = evt.graphic.attributes['NAME'];

                    // var selectQuery = new Query();
                    // selectQuery.objectIds = [evt.graphic.attributes.OBJECTID];

                    var selectQuery = new Query();
                    selectQuery.where = "NAME = '" + seldq + "'";
                    featureLayer.selectFeatures(selectQuery, featureLayer.SELECTION_NEW);
                } else {
                    var finddzm = FindDzm(evt.graphic.symbol.text);
                    if (finddzm != '') {
                        seldq = evt.graphic.symbol.text;
                        seldzm = finddzm;
                        var query = new Query();
                        query.where = "NAME = '" + seldq + "'";
                        featureLayer.selectFeatures(query, featureLayer.SELECTION_NEW);
                    } else {
                        seldq = curdq;
                        seldzm = curdzm;
                        featureLayer.clearSelection();
                    }
                }
            } catch (e) {
                seldq = curdq;
                seldzm = curdzm;
                featureLayer.clearSelection();
            }
            UpdateView();
        });

        if (bRender);
        //RenderLayer('3708');
        //return featureLayer;
    });
}

function GetMinMax(field) {
    var min = parseFloat(datas[0][field]),
        max = parseFloat(datas[0][field]);
    $.each(datas, function (n, row) {
        if (parseFloat(row[field]) > max)
            max = parseFloat(row[field]);
        if (parseFloat(row[field]) < min)
            min = parseFloat(row[field]);
    });
    return {
        min: min,
        max: max
    };
}

function zfill(num, size) {
    var s = num + "000000000";
    return s.substr(0, size);
}

function getGColorByHSL(hval, value, range) {
    var lowval = 0.4;
    var highval = 1;
    var posval = (value - range.min) / (range.max - range.min);
    var gval = lowval + (highval - lowval) * posval;

    var lowb = 1;
    var highb = 0.3;
    var bval = lowb - (lowb - highb) * posval;
    var rgb = Please.HSV_to_RGB({
        h: hval,
        s: gval,
        v: bval
    })
    return [rgb.r, rgb.g, rgb.b]
}

function GetColorByHSL(value, range) { //[0,0,250] [0,0,50]
    //[120,1,1] [0,1,1] 
    var lowval = 180;
    var highval = 10;
    //var depth = Math.round(lowc + (highc - lowc) * posval);
    var posval = (value - range.min) / (range.max - range.min);
    var gval = Math.round(lowval - (lowval - highval) * posval);
    var rgb = Please.HSV_to_RGB({
        h: gval,
        s: 1,
        v: 1
    })
    return [rgb.r, rgb.g, rgb.b]
    //var ret = hslToRgb(gval*1.0/360, 1, 1);
    //ret.push(0.9);
    //var s = Please.make_color();
    //var h = Please.HSV_to_RGB();
    return ret;
}

function GetColor(value, range) {
    //[250,250,250] [0,0,250]
    var lowval = 255;
    var highval = 0;
    var posval = (value - range.min) / (range.max - range.min);
    var gval = Math.round(lowval - (lowval - highval) * posval);
    return [gval, gval, lowval, 0.9];
}

function rand255() {
    return Math.ceil(Math.random() * 255);
}

function getopc(value, range) {
    var lowval = 0.3;
    var highval = 1;
    var posval = (value - range.min) / (range.max - range.min);
    var gval = Math.round(lowval + (highval - lowval) * posval);
    return gval;
}

function getsize(value, range) {
    var lowval = 10;
    var highval = 80;
    var posval = (value - range.min) / (range.max - range.min);
    var gval = Math.round(lowval + (highval - lowval) * posval);
    return gval;
}

function RenderLayerBySymbol(dzm, fields) {
    require([
        "esri/symbols/SimpleMarkerSymbol", "esri/renderers/UniqueValueRenderer", "esri/Color",
        "dojo/domReady!"
    ], function (SimpleMarkerSymbol, UniqueValueRenderer, Color) {
        var defaultSymbol = new SimpleMarkerSymbol();
        //create renderer
        var renderer = new UniqueValueRenderer(defaultSymbol, "AREA_CODE");
        var ranges = [GetMinMax(fields[0]), GetMinMax(fields[1])];
        BuildSymbolRender(fields, ranges, renderer, Color, SimpleMarkerSymbol);
        featureLayer.setRenderer(renderer);
        featureLayer.redraw();
    });
}
//fields[0]色深fields[1]大小
function BuildSymbolRender(fields, ranges, renderer, Color, SimpleMarkerSymbol) {
    //var color = new Color([rand255(),rand255(),rand255()]);
    var hval = Math.ceil(Math.random() * 360);
    $.each(datas, function (n, row) {


        var renderColor = new Color(getGColorByHSL(hval, row[fields[0]], ranges[0]));
        //new Color([color.r, color.g,color.b,getopc(row[fields[0]], ranges[0])]);
        //var renderColor = new Color(GetColor(row[fields[0]], ranges[0]));
        var rendersize = getsize(row[fields[1]], ranges[1]);
        var sym = new SimpleMarkerSymbol().setColor(renderColor).setSize(rendersize);
        renderer.addValue({
            value: zfill(row['区划码'], 12),
            symbol: sym,
            label: row['地区'] + ':' + row[fields[0]] + ';' + row[fields[1]]
        });
    });
}

function BuildRender(field, range, renderer, colortype, Color, SimpleFillSymbol) {
    var lowc = 10;
    var highc = 255;
    var hval = Math.ceil(Math.random() * 360);
    $.each(datas, function (n, row) {
        var renderColor;
        if (colortype == 1) renderColor = new Color(GetColor(row[field], range));
        else if (colortype == 2) {
            renderColor = new Color(getGColorByHSL(hval, row[field], range));
        }
        renderer.addValue({
            value: zfill(row['区划码'], 12),
            symbol: new SimpleFillSymbol().setColor(renderColor),
            label: row['地区'] + ':' + row[field]
        });
    });
}

function RenderLayer(dzm, field, colortype) {
    require([
        "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol",
        "esri/renderers/UniqueValueRenderer", "esri/Color", "esri/layers/FeatureLayer",
        "dojo/domReady!"
    ], function (
        SimpleLineSymbol, SimpleFillSymbol,
        UniqueValueRenderer, Color, FeatureLayer
    ) {
        var defaultSymbol = new SimpleFillSymbol().setStyle(SimpleFillSymbol.STYLE_NULL);
        //create renderer
        var renderer = new UniqueValueRenderer(defaultSymbol, "AREA_CODE");
        var range = GetMinMax(field);
        BuildRender(field, range, renderer, colortype, Color, SimpleFillSymbol);
        featureLayer.setRenderer(renderer);
        featureLayer.redraw();
    });
}

function FullExtent() {
    //map.setExtent(featureLayer.fullExtent);
    require([
        "esri/graphicsUtils", "dojo/domReady!"
    ], function (graphicsUtils) {
        var myFeatureExtent = graphicsUtils.graphicsExtent(featureLayer.graphics);
        map.setExtent(myFeatureExtent);
    });
}

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