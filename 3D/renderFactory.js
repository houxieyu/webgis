/**
 * Created by hxy on 2017/4/16.
 */
define(["esri/symbols/PolygonSymbol3D", "esri/renderers/UniqueValueRenderer", "esri/symbols/ExtrudeSymbol3DLayer",
    "esri/renderers/SimpleRenderer",
    "esri/symbols/PointSymbol3D",
    "esri/symbols/ObjectSymbol3DLayer", "esri/symbols/SimpleFillSymbol"
], function (PolygonSymbol3D, UniqueValueRenderer, ExtrudeSymbol3DLayer, SimpleRenderer, PointSymbol3D, ObjectSymbol3DLayer, SimpleFillSymbol) {

    function rand255() {
        return Math.ceil(Math.random() * 255);
    }
    /** 生成随机符号 */
    function randsym(params) {
        var polycolsym = new PolygonSymbol3D({
            symbolLayers: [
                new ExtrudeSymbol3DLayer({
                    material: {
                        color: [rand255(), rand255(), rand255()]
                    }
                })
            ]
        });
        /** 定义渲染符号 */
        var colSymbol = new PointSymbol3D({
            symbolLayers: [new ObjectSymbol3DLayer({
                width: params.bottomwidth,
                resource: {
                    primitive: "cylinder"
                },
                material: {
                    color: [rand255(), rand255(), rand255()]
                }
            })]
        });
        var polysymbol = new SimpleFillSymbol({
            color: [rand255(), rand255(), rand255()]
        });
        var symbols = [colSymbol, polycolsym, polysymbol];
        return symbols[params.symboltype];
    }
    /** 可视化映射 */
    function getvisualVariable(param, datas, datafield) {

        var visualVariables = [
            [//3D柱图
                {
                    type: "size",
                    field: function (x) {
                        // 关联数据源
                        // 通过areacode查询json对象数组
                        var data = datas.find((n) => n.区划码 == getAreaTrim(x.attributes.AREA_CODE));
                        if (data)
                            return data[datafield] * param.valweight;
                        else return 0;
                    },
                    axis: "height",
                    //    useSymbolValue: true,
                    valueUnit: "feet" // Converts and extrudes all data values in feet
                },
                {
                    type: "size",
                    axis: "width",
                    useSymbolValue: true,
                    valueUnit: "feet" // Converts and extrudes all data values in feet
                },
                {
                    type: "color",
                    field: function (x) {
                        // 关联数据源
                        // 通过areacode查询json对象数组
                        var data = datas.find((n) => n.区划码 == getAreaTrim(x.attributes.AREA_CODE));
                        if (data)
                            return data[datafield];
                        else return 0;
                    },
                    stops: [
                        {
                            value: minmax.max,
                            color: "red"
                        },
                        {
                            value: minmax.min,
                            color: "blue"
                        }
                    ]
                }
            ],
            [//这个是3D多边柱图
                {
                    type: "size",
                    field: function (x) {
                        // 关联数据源
                        // 通过areacode查询json对象数组
                        var data = datas.find((n) => n.区划码 == getAreaTrim(x.attributes.AREA_CODE));
                        if (data)
                            return data[datafield] * param.valweight;
                        else return 0;
                    },
                    valueUnit: "feet" // Converts and extrudes all data values in feet
                },
                {
                    type: "color",
                    field: function (x) {
                        // 关联数据源
                        // 通过areacode查询json对象数组
                        var data = datas.find((n) => n.区划码 == getAreaTrim(x.attributes.AREA_CODE));
                        if (data)
                            return data[datafield];
                        else return 0;
                    },
                    stops: [
                        {
                            value: minmax.max,
                            color: "#4a0069"
                        },
                        {
                            value: minmax.min,
                            color: "#b300ff"
                        }
                    ]
                }
            ],
            [//这个是2D面
                {
                    type: "color",
                    field: function (x) {
                        // 关联数据源
                        // 通过areacode查询json对象数组
                        var data = datas.find((n) => n.区划码 == getAreaTrim(x.attributes.AREA_CODE));
                        if (data)
                            return data[datafield];
                        else return 0;
                    },
                    stops: [
                        {
                            value: minmax.max,
                            color: "#4a0069"
                        },
                        {
                            value: minmax.min,
                            color: "#b300ff"
                        }
                    ]
                }
            ]
        ];
        if (param.colortype == 1)
            visualVariables.forEach(element => {
                element.pop();
            });
        return visualVariables[param.symboltype]
    }
    //地址码补齐
    function zfill(num, size) {
        var s = num + "000000000000";
        return s.substr(0, size);
    }

    /** 定义渲染符号 */
    var resSym = new PolygonSymbol3D({
        symbolLayers: [
            new ExtrudeSymbol3DLayer({
                material: {
                    color: "#FC921F"
                }
            })
        ]
    });
    var fillsymbol = new SimpleFillSymbol();
    function getsymbol(params) {
        var objectSymbol = new PointSymbol3D({
            symbolLayers: [new ObjectSymbol3DLayer({
                width: params.bottomwidth,
                resource: {
                    primitive: "cylinder"
                },
                material: {
                    color: "#FFD700"
                }
            })]
        });
        /**
         *  symbols[0]是柱状图,[1]是多边柱,[2]是平面图
         */
        var symbols = [objectSymbol, resSym, fillsymbol];
        return symbols[params.symboltype];
    }
    //渲染器对外接口
    function getRenderer(params, datas, datafield) {
        return getUniqueRender(params, datas, datafield);
        //return getObjectRender(param, datas, datafield);
    }
    /** 唯一值渲染器，灵活性强 */
    function getUniqueRender(params, datas, datafield) {
        var uniquerenderer = new UniqueValueRenderer({
            defaultSymbol: getsymbol(params),
            field: function ss(f){return f.attributes['AREA_CODE'];
            },
            visualVariables: getvisualVariable(params, datas, datafield)
        });
        datas.forEach(data => {
            var valueinfo = {
                value: zfill(data['区划码'], 12),
                label: data['地区'] + data[datafield]
            };
            //如果为分色渲染，循环插入渲染符号
            if (params.colortype == 1){
                valueinfo.symbol = randsym(params);
                uniquerenderer.addUniqueValueInfo(valueinfo);
            }
        });
        return uniquerenderer;
    }
    /** 简单渲染器 */
    function getObjectRender(params, datas, datafield) {
        objectSymbolRenderer = new SimpleRenderer({
            symbol: getsymbol(params),
            visualVariables: getvisualVariable(params, datas, datafield)
        });
        return objectSymbolRenderer;
    }

    return {
        getRenderer: getRenderer
    }
});