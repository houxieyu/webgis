/**
 * Created by hxy on 2017/4/16.
 */
define(['renderFactory', "esri/Map","esri/views/MapView",'esri/Basemap',"esri/config","esri/layers/GraphicsLayer",
    "esri/views/SceneView","esri/Graphic",
    "esri/layers/FeatureLayer",
    "esri/layers/MapImageLayer",
    "esri/widgets/Legend",
    "esri/Camera",
    "esri/layers/support/LabelClass",
    "esri/symbols/TextSymbol3DLayer",
    "esri/symbols/LabelSymbol3D",
    "esri/layers/WebTileLayer" ,
    "esri/geometry/Polyline","esri/symbols/SimpleLineSymbol", "esri/geometry/Polygon","esri/symbols/SimpleFillSymbol",
    "esri/tasks/support/Query","esri/tasks/QueryTask","esri/symbols/TextSymbol",
    "dojo/domReady!"], function (renderFactory, Map,MapView,Basemap,esriConfig, GraphicsLayer,
        SceneView,Graphic, FeatureLayer, MapImageLayer,Legend, Camera, LabelClass,
                                 TextSymbol3DLayer, LabelSymbol3D,WebTileLayer,
                                 Polyline,SimpleLineSymbol,Polygon,SimpleFillSymbol,Query,QueryTask,TextSymbol) {
    var map,view,graphicsLayer;
    //加载天地图
    var tdurl = "http://{subDomain}.tianditu.com/{servname}/wmts?"
        + "SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER={layer}&STYLE=default&TILEMATRIXSET={set}&FORMAT=tiles"
        + "&TILEMATRIX={level}&TILEROW={row}&TILECOL={col}";
    var tdvecurl = tdurl.replace('{servname}','vec_w').replace('{layer}','vec').replace('{set}','w');
    var tdsaturl =  tdurl.replace('{servname}','img_w').replace('{layer}','img').replace('{set}','w');
    var tdterurl =  tdurl.replace('{servname}','ter_w').replace('{layer}','ter').replace('{set}','w');

    var tdvecmkurl = tdurl.replace('{servname}','cva_w').replace('{layer}','cva').replace('{set}','w');
    var tdsatmurl = tdurl.replace('{servname}','cia_w').replace('{layer}','cia').replace('{set}','w');
    var tdtermurl = tdurl.replace('{servname}','cta_w').replace('{layer}','cta').replace('{set}','w');
    var tdlayerurls = [tdvecurl,tdsaturl,tdterurl];
    var tdmlayerurls = [tdvecmkurl,tdsatmurl,tdtermurl];
    var canDraw = false;

    var serverip;
    $.ajaxSettings.async = false; 
    $.getJSON("../Scripts/serverip.json", function (result){
        console.log(result);
        serverip = result.ip;
    });
    $.ajaxSettings.async = true; 
    var qxdzms = ['370811','370812','370826','370827','370828','370829','370830','370831','370832','370871','370881','370883'];
    function setBaseMap(basetype){
        var tdbaselayer = new WebTileLayer({
            urlTemplate:tdlayerurls[basetype],//"http://{subDomain}.tianditu.com/DataServer?T=vec_c&X={col}&Y={row}&L={level}",
            copyright: "Tianditu",
            id: "Tianditu",
            subDomains: ["t0", "t1", "t2"]
            //,tileInfo:tileInfoObj
        });
        //底图标注
        var tdmarkerlayer = new WebTileLayer({
            urlTemplate:tdmlayerurls[basetype],//"http://{subDomain}.tianditu.com/DataServer?T=cva_c&X={col}&Y={row}&L={level}",
            copyright: "Tianditu",
            id: "Tianditu2",
            subDomains: ["t0", "t1", "t2"]
            // ,           tileInfo:tileInfo
        });
        map.basemap = new Basemap({
            baseLayers: [tdbaselayer,tdmarkerlayer],
            title: "天地图国家地理在线服务",
            id: "myBasemap"
        });
    }
    function findQXBaseLayer(){
        return map.layers.find(function(lyr){
            return lyr.id === "qxbase";
        });
    }
    function addQXBaseLayer(){
        if(findQXBaseLayer()==null)
        {
            var baselayer = new MapImageLayer({
                url: 'http://' + serverip + ':6080/arcgis/rest/services/lwbj/MapServer/',
                opacity:0.8,
                id:'qxbase'
            });
/*                new MapImageLayer({
            url: "http://"+serverip+":6080/arcgis/rest/services/JINING/JININGmap/MapServer"
        });*/

            map.layers.unshift(baselayer);
        }
    }
    var spatiallayer;
    function addSpatialLayer(){
        spatiallayer = new FeatureLayer({
            url: 'http://' + serverip + ':6080/arcgis/rest/services/lwbj/MapServer/9',
            opacity:0,
            id:'spatiallayer',
            outFields: ["NAME", "AREA_CODE"]//,
            //definitionExpression:"AREA_CODE like '370811%'"
        });
        map.layers.add(spatiallayer);
    }
    function removeQXBaseLayer(){
        map.layers.remove(findQXBaseLayer());
    }
    function showQXBaseLayer(isshow){
        if(isshow)
        {
            addQXBaseLayer();
        }
        else removeQXBaseLayer();
    }
    var cam2 = new Camera({
        position: {
            x: 117.64,
            //y: 34.33,
            y:35.3,
            z: 100000
        },
        heading: 0,
        tilt: 45
    });
    function initMap(viewtype,viewmodel){
        //parser.parse();
        esriConfig.request.corsEnabledServers.push("t0.tianditu.com", "t1.tianditu.com", "t2.tianditu.com");
        esriConfig.request.corsEnabledServers.push("124.133.27.90:6081");
        if(map==null) {
            map = new Map({
            //    basemap:"osm",
                ground: "world-elevation"
            });
            setBaseMap(0);
            addQXBaseLayer();
            addSpatialLayer();
        }
        graphicsLayer = new GraphicsLayer();
        map.add(graphicsLayer);

        var views = [
            new MapView(),
            new SceneView({
               // camera:cam2
            })
        ];

        view = views[viewtype];
        view.container = "viewDiv";
        view.map = map;
        if(viewtype==1)views[viewtype].viewingMode = viewmodel;
        view.on('click',viewclick);
        view.on('pointer-move',viewmousemove);

        return view;
    }
    var points = [];
    var querypolygon;
    function viewclick(evt){
        if(evt.button ==0) {
            if (canDraw) {
                points.push(evt.mapPoint);
            }
        }
        else   if(evt.button ==2) {
            if (canDraw) {
                if(points.length==0) {
                    changeDrawState();
                    return;
                }
                points = [];
                spatialQuery();
            }
        }
    }
    function viewdbclick(evt){

    }
    function viewmousemove(evt){
        if(canDraw){
            if (points.length > 0) {
                view.graphics.removeAll();
                view.hitTest({x:evt.x,y:evt.y}).then(function(ret){
                    drawLine(points.concat([ret.results[0].mapPoint,points[0]]));
                });

            }
        }
    }

    function render3DMap(layer,render){
        layer.renderer = render;
    }
    function buildLayer(url,renderer,labelclass,dzm){
        return new FeatureLayer({
            url: url,
            renderer: renderer,
            definitionExpression:"AREA_CODE like '"+dzm+"%'",
            popupEnabled:false,
            popupTemplate: {
                title: "{NAME}",
                content: [
                    {
                        type: "fields",
                        fieldInfos: [
                            {
                                fieldName: "NAME",
                                label: "地区"
                            },
                            {
                                fieldName: "AREA_CODE",
                                label: "区划码"
                            }
                        ]
                    }
                ]
            }, 
            outFields: ["NAME", "AREA_CODE"],
            labelsVisible: true,
            labelingInfo: [labelclass]
            //definitionExpression: "ELEVATION > 0", // show only buildings with height
        });
    }
    function activeDraw(){
        //drawToolbar.activate(Draw.FREEHAND_POLYGON);
    }
    function changeDrawState(){
        //drawToolbar = new Draw(map);
        canDraw = !canDraw;
        if(canDraw){
            $("#viewDiv").css("cursor","crosshair");
            $('#btspatialquery').text('关闭查询');
        }
        else {
            $("#viewDiv").css("cursor","default"); points = [];
            $('#btspatialquery').text('空间查询');
        }

    }
    var showPiao = false;
    var showPiaoevt;
    function enablePiao(){
        showPiao = !showPiao;
        if(showPiao){
            showPiaoevt = view.on('pointer-move',function(evt){
                var screenPoint = {
                    x: evt.x,
                    y: evt.y
                };
                // the hitTest() checks to see if any graphics in the view
                // intersect the given screen x, y coordinates
                view.hitTest(screenPoint).then(function getGraphics(response){
                    var feature = response.results[0].graphic;
                    var mapPoint = response.results[0].mapPoint;
                    if(feature) {
                        //弹出自定义div
                        /* view.popup.features = [feature];
                        view.popup.open({
                            // Set the popup's title to the coordinates of the clicked location
                            //title: "Reverse geocode",
                            location: mapPoint // Set the location of the popup to the clicked location
                        }); */
                        $('#popinfo').text(feature.attributes['NAME']+':'+
                            datasource.find((n) => n.区划码 == 
                            getAreaTrim(feature.attributes.AREA_CODE))[renderparams.field]);
                        $('#popinfo').show();   
                        $('#popinfo').css('top',evt.y+3);
                        $('#popinfo').css('left',evt.x+3);
                    }
                    else{
                        //关闭自定义div
                        $('#popinfo').hide();   
                    }
                });
            });
        }
        else{
            showPiaoevt.remove();
        }
    }

    function Clearquery(){
        view.graphics.removeAll();
        $('#nyc_graphics').empty();
    }
    function drawLine(points){
        // First create a line geometry (this is the Keystone pipeline)
        //var heigh = 200000;
        var polyline = new Polyline({
            paths: [[
//                [-111.30, 52.68,heigh],
//                [-98, 49.5,heigh],
//                [-93.94, 29.89,heigh]
 /*                 [ptstart.longitude, ptstart.latitude,ptstart.z+100],
                 [ptend.longitude, ptend.latitude,ptend.z+100]*/
            ]
            ]
            //spatialReference: { wkid: 4326 }
        });
        querypolygon = new Polygon({
            //2维数组无效，待测试
            rings: [
                []
            ]
        });

        for(var i=0;i<points.length;i++){
            polyline.paths[0].push([points[i].longitude,points[i].latitude]);
            querypolygon.rings[0].push([points[i].longitude,points[i].latitude]);
        }

        var lineSymbol = new SimpleLineSymbol({
            color: [226, 119, 40],
            width: 4
        });
        var polylineGraphic = new Graphic({
            geometry: polyline,
            symbol: lineSymbol
        });
        var fillSymbol = new SimpleFillSymbol({
            color: [227, 139, 79, 0.8],
            outline: { // autocasts as new SimpleLineSymbol()
                color: [255, 0, 0],
                width: 1
            }
        });
        var polygonGraphic = new Graphic({
            geometry: querypolygon,
            symbol: fillSymbol
        });
        //view.graphics.add(polylineGraphic);
        view.graphics.add(polygonGraphic);
        //graphicsLayer.add(polylineGraphic);
        //graphicsLayer.add(polygonGraphic);
    }
    var urlpre = 'http://'+serverip+':6080/arcgis/rest/services/lwbj/MapServer/';
    var layerurls = [1,2,3,4];
    var ptlayerurls = [5,6,7,8];  
    var datasource;  
    /**
     * @param  {int} showtype 0 柱状、1 多边柱、2 平面
     * @param  {int} layno 0 老区县 1 新区县 3 乡镇 4 村   
     * @param  {array} datas 数据源
     * @param  {string} field 渲染字段
     * @param  {string} filtercode 过滤区划码
     */
    function show3DMap(params) {
        datasource = params.datas;
        //生成渲染器
        //  var renderer = renderFactory.getObjectRender({
           var renderer = renderFactory.getRenderer({  
               colortype:params.colortype, 
               symboltype:params.showtype,
              bottomwidth:bottomwidths[params.layno],
              valweight: valweights[params.layno]
          },params.datas,params.field);
    
            var labelClass = new LabelClass( {
                symbol: new LabelSymbol3D({
                    symbolLayers: [new TextSymbol3DLayer({
                        material: {
                            color: "blue"
                        },
                        size: 16
                    })]
                }),
                labelPlacement: "above-right",
                labelExpressionInfo: {
                   value: "{NAME}" 
                } 
            });
            var layerurl = urlpre+layerurls[params.layno];    
            //如果是柱状图，需要用点图层渲染
            if(params.showtype == 0)layerurl = urlpre+ptlayerurls[params.layno]
            var buildlayer = buildLayer(layerurl,renderer,labelClass,params.areacode);
            //村级渲染，关闭标签显示
            if(params.layno==3)buildlayer.labelsVisible = false;
            map.layers.add(buildlayer);
            var legend = new Legend({
                view: view,
                layerInfos: [{
                  layer: buildlayer,
                  title: '图例:'+params.field
                }]
              });
              view.ui.empty("bottom-left");
            view.ui.add(legend, "bottom-left");
            gotoCam();
            return buildlayer;
        }

    var qgraphics;
    function spatialQuery(){
        var queryTask = new QueryTask({
            url: "http://"+serverip+":6080/arcgis/rest/services/lwbj/MapServer/9"  // URL of a feature layer representing U.S. cities
        });
        var selectQuery = spatiallayer.createQuery();
        selectQuery.set({
            geometry : querypolygon,
            outFields : ["np_DBO_lwbj_cun.NAME", "np_DBO_lwbj_cun.AREA_CODE",'lwdata.农业人口数'],
            spatialRelationship:$('#tpgx').val()
        });
        /*   var selectsymbol = new SimpleFillSymbol({
            color: [255, 0, 0, 1],
            outline: { // autocasts as new SimpleLineSymbol()
                color: [255, 255, 255],
                width: 1
            }
        });*/
        var popuptemplate = ( {
            title: "{NAME}",
            content: [
                {
                    type: "fields",
                    fieldInfos: [
                        {
                            fieldName: "np_DBO_lwbj_cun.NAME",
                            label: "地区"
                        },
                        {
                            fieldName: "np_DBO_lwbj_cun.AREA_CODE",
                            label: "区划码"
                        },
                        {
                            fieldName: "lwdata.农业人口数",
                            label: "人口数"
                        }
                    ]
                }
            ]
        });
        queryTask.execute(selectQuery).then(function(results){
            //view.whenLayerView(spatiallayer).then(function(lyrView) {
            //lyrView.queryFeatures(selectQuery).then(function(results) {
            qgraphics = results.features;
            //清空列表
            $('#nyc_graphics').empty();
            var totalrenkou = 0;
            results.features.forEach(function(result,index) {
                result.symbol =new SimpleFillSymbol({
                    color: [0, 0, 0, 0.1],
                    outline: { // autocasts as new SimpleLineSymbol()
                        color: result.attributes['np_DBO_lwbj_cun.AREA_CODE'].substr(9,3)<200?[255,0,0]:[255, 255, 0],
                        width: 1
                    }
                });
                result.popupTemplate = popuptemplate;
                totalrenkou += result.attributes['lwdata.农业人口数'];
                //添加条目
                var li="<li class='panel-result' liid='"+index+"'>"+result.attributes['np_DBO_lwbj_cun.NAME']+":"+result.attributes['np_DBO_lwbj_cun.AREA_CODE']+" </li>";
                $('#nyc_graphics').append(li);
            });
            var r = "<b>查询范围内有村居<font color='red'>" + results.features.length + "</font>个<br/>人口数：" + totalrenkou;
            $("#querytext").html(r);
            view.graphics.removeAll();
            view.graphics.addMany(results.features);
            //条目点击事件
            $('#nyc_graphics li').click(function(evt){
                var idx = parseInt($(event.target).attr('liid'));
                var graph = qgraphics[idx];
                view.popup.open({
                    features: [graph],
                    location: graph.geometry.centroid
                });
                view.goTo([graph.geometry.centroid.x,graph.geometry.centroid.y]);
            });
        });
    }
    function clearbaseuponlayer(){
        while(map.layers.length > 2){
            map.layers.pop();
        }
    }
    function gotoCam(){

        view.goTo(cam2);
    }
    return {
        show3DMap: show3DMap,
        initMap:initMap,
        render3DMap:render3DMap,
        setBaseMap:setBaseMap,
        showQXBaseLayer:showQXBaseLayer,
        activeDraw:activeDraw,
        enableDraw:changeDrawState,
        spatialQuery:spatialQuery,
        clearbaseuponlayer:clearbaseuponlayer,
        Clearquery:Clearquery,
        gotoCam:gotoCam,
        enablePiao:enablePiao
    }
});
