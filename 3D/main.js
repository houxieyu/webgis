
var gisapiurls = ["arcgisapi", "http://124.133.27.90:6081/arcgis_js_api3.18/library/3.18/3.18",
    "http://124.133.27.90:6081/library/4.3", "../arcgisjs/4.3"];
var urlidx = 3;
require.config({
    paths: {
        "jquery": "jquery",
        "esri": gisapiurls[urlidx] + "/esri",
        "dojo": gisapiurls[urlidx] + "/dojo",
        "dojox": gisapiurls[urlidx] + "/dojox",
        "dijit": gisapiurls[urlidx] + "/dijit",
        "moment": gisapiurls[urlidx] + "/moment",
        "renderFactory": "renderFactory",
        "gismain": "gismain"
    }
});

function threejsinit() {
    // renderer
    var renderer = new THREE.WebGLRenderer({
        canvas: $('canvas')[0]
    });
    renderer.setClearColor(0x000000); // black
    // scene
    var scene = new THREE.Scene();
    // camera
    var camera = new THREE.PerspectiveCamera(45, 4 / 3, 1, 1000);
    camera.position.set(0, 0, 5);
    scene.add(camera);
    // a cube in the scene
    var cube = new THREE.Mesh(new THREE.CubeGeometry(1, 2, 3),
        new THREE.MeshBasicMaterial({
            color: 0xff0000
        })
    );
    scene.add(cube);
    // render
    renderer.render(scene, camera);
}

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

    /* @param  {int} layno 0 老区县 1 新区县 2 乡镇 3 村   */
    
function filterdatas(layno, result) {
    /** 过滤数据，根据区划长度、区划码 */
    var sublen = 0, filtercode = '';
    switch (layno) {
        //大莱芜图层，过滤掉新五区
        case 0: sublen = 6; filtercode = '37121'; break;
        //新区图层，过滤掉大莱芜区
        case 1: sublen = 6; filtercode = '371202'; break;
        case 2: sublen = 9; break;
        case 3: sublen = 12; break;
    }
    //过滤数据，只保留图层中有的区划
    var datas = result.filter(function (x) {
        console.log( x['区划码'].substr(0, (filtercode==''?1:filtercode.length)));
        return x['区划码'].length == sublen && 
            x['区划码'].substr(0, (filtercode==''?1:filtercode.length)) != filtercode;
    });
    return datas;
}
    /************** 
     * 
     * 对象数组统计
     * 
     ***************/
    function getminmax(datas, field, filter) {
        //var field = '人口数';
        var min = parseInt(datas[0][field]);
        var max = parseInt(datas[0][field]);
        var len = datas.length;
        for (var i = 1; i < len; i++) {
            var tdata = parseInt(datas[i][field]);
            if (tdata < min) {
                min = tdata;
            } if (tdata > max) {
                max = tdata;
            }
        }
        return { min: min, max: max };
    }
        //柱状图在不同的区划级别，柱形的直径、高度权重需要分别设置
        // 现在的高度权重是根据农户人口数设置的，不同的指标应当自适应高度权重
        /**                  县、 新县、 乡、  村 */
        var bottomwidths = [10000,8000,4000,500];
        var valweights =   [0.1, 0.1, 0.5,   5];
        var renderparams;
        var minmax;
require(['jquery', 'gismain', 'renderFactory'], function ($, gismain, renderFactory) {
    $(function () {
        $('#tpgx').hide();
        $('#messages div span').hide();
        //界面初始化
        $('#popinfo').hide();
        $('#popinfo').mousemove(function(e){
            $('#popinfo').css('top',e.pageY+3);
            $('#popinfo').css('left',e.pageX+3);
        });
        /**
         * 获取json数据回调后渲染地图
         */
        $.getJSON("../Scripts/bigdata.json", function (result) {
            // $('#viewDiv').height($(window).height()-$('#viewDiv').offset().top);
            //渲染参数设置
            renderparams = {
                /** showtype 0 柱图，1 多边柱，2 面 */
                showtype: 0,
                /** colortype 0 渐变 1 分色*/
                colortype: 1,
                /** 0    1    2   3   
                 *  县、 新县、乡、村 */
                layno: 2,
                field: '农业人口数',
                areacode: '3712'
            }
            var view = gismain.initMap(1, 'global');//3D
            view.then(function () {
                gismain.gotoCam();
                redraw3Dmap();
                gismain.enablePiao();
            });

            function redraw3Dmap() {
                /** 获取数据源数值范围 */
                gismain.clearbaseuponlayer();
                renderparams.datas = filterdatas(renderparams.layno, result);
                renderparams.datas.sort((a,b)=> (b[renderparams.field]-a[renderparams.field]));
                //自适应渲染强度
                //重新计算数值权重，最大高度假设为80000，除以max值，则为权重系数
                var maxheight = 80000;
                if (renderparams.datas)
                    minmax = getminmax(renderparams.datas, renderparams.field);
                else minmax = { min: 0, max: 10000 };
                if(minmax.max<=50000)
                    maxheight = 50000;
                if(minmax.max<=20000)
                    maxheight = 20000;
        
                valweights[renderparams.layno] = maxheight/minmax.max;
                gismain.show3DMap(renderparams);
            }
            //3D多边柱形
            $('#bt3dcol').on('click', function () {
                //分色 柱状
                renderparams.colortype=1;
                renderparams.showtype=0;
                redraw3Dmap();
            });
            $('#bt3dpolycol').on('click', function () {
                renderparams.colortype=1;
                renderparams.showtype=1;
                redraw3Dmap();
            });
            $('#bt2d').on('click', function () {
                renderparams.colortype=0;
                renderparams.showtype=2;
                redraw3Dmap();
            });
            //指标选择
            $('#nyrk').on('click', function () {
                renderparams.field='农业人口数';
                redraw3Dmap();
            });
            $('#nhs').on('click', function () {
                renderparams.field='农户数';
                redraw3Dmap();
            });
            $('#gmhs').on('click', function () {
                renderparams.field='规模户数';
                redraw3Dmap();
            });
            $('#jydws').on('click', function () {
                renderparams.field='经营单位数';
                redraw3Dmap();
            });
            //层级设置
            $('#xq').on('click', function () {
                renderparams.layno=1;
                redraw3Dmap();
            });
            $('#dlc').on('click', function () {
                renderparams.layno=0;
                redraw3Dmap();
            });
            $('#xz').on('click', function () {
                renderparams.layno=2;
                redraw3Dmap();
            });
            $('#cun').on('click', function () {
                renderparams.layno=3;
                redraw3Dmap();
            });
            //底图管理
            $('#btbmvec').on('click', function () {
                gismain.setBaseMap(0);
            });
            $('#btbmimg').on('click', function () {
                gismain.setBaseMap(1);
            });
            $('#bt3clear').on('click', function () {
                gismain.clearbaseuponlayer();
            });
            $('#btbmter').on('click', function () {
                gismain.setBaseMap(2);
            });
            //飘窗
            $('#btpiao').on('click', function () {
                gismain.enablePiao();
                $('#btpiao').text($('#btpiao').text() == '开启飘窗' ? '关闭飘窗' : '开启飘窗');
            });
            //清除查询
            $('#btspatialqueryclear').on('click', function () {
                //gismain.spatialQuery();
                gismain.Clearquery();
            });
            //空间查询
            $('#btspatialquery').on('click', function () {
                gismain.enableDraw();


                //threejsinit();
                //gismain.activeDraw();
                //layer.labelsVisible = false;
                //            var canvas=$('canvas')[0];
                //            var pen=canvas.getContext("webgl");
                //            pen.moveTo(0,0);
                //            pen.lineTo(1600,1600);
                //            pen.stroke();
            });
            $('#bt3dcuncol').on('click', function () {
                layer = gismain.show3DMap(3);
                layer.labelsVisible = false;
            });
            $('#bt3dcunpolycol').on('click', function () {
                //layer = gismain.show3DMap(2);
                layer = gismain.show3DMap(4);
                //layer.labelsVisible = false;
            });
            $('#bt3danim').on('click', function () {
                var layer = gismain.show3DMap(1);
                var weight = 0.1;
                setInterval(function () {
                    weight += 0.05;
                    //weight = 0;
                    render = renderFactory.getObjectRender({
                        bottomwidth: 10000,
                        valweight: weight,
                        min: 150000 * weight,
                        max: 800000 * weight
                    });
                    gismain.render3DMap(layer, render);
                }, 1000)
            });
        });
    })
})