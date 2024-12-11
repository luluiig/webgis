if (typeof MMap == "undefined") { var MMap = {}; }
MMap.kriging = {
    map: null,//地图对象
    canvasLayer:null,
    canvas:null,
    data: [{
            "name": "茂县",
            "level": 3,
            "value": 60,
            "latlon": [103.841867, 31.672280]
        },
        {
            "name": "凤仪镇",
            "level": 3,
            "value": 80,
            "latlon": [103.839128, 31.675192]
        },
        {
            "name": "叠溪镇",
            "level": 4,
            "value": 110,
            "latlon": [103.679251, 32.043717]
        },
        {
            "name": "雅都镇",
            "level": 4,
            "value": 120,
            "latlon": [103.361698, 31.886560]
        },
        {
            "name": "光明乡",
            "level": 2,
            "value": 30,
            "latlon": [103.951401, 31.736288]
        },
        {
            "name": "南新乡",
            "level": 2,
            "value": 50,
            "latlon": [103.732946, 31.580933]
        },
        {
            "name": "回龙乡",
            "level": 2,
            "value": 44,
            "latlon": [103.651485, 31.825709]
        },
        {
            "name": "飞虹乡",
            "level": 3,
            "value": 89,
            "latlon": [103.6735247, 31.796525]
        },
        {
            "name": "永和乡",
            "level": 1,
            "value": 20,
            "latlon": [103.838301, 31.832557]
        },
        {
            "name": "富顺镇",
            "level": 3,
            "value": 78,
            "latlon": [104.008046, 31.754841]
        },
        {
            "name": "东兴镇",
            "level": 1,
            "value": 10,
            "latlon": [104.113914, 31.790749]
        }],
    Init: function (map) {
        this.map = map;
        $("#yqfx").on("click", function () {
            MMap.kriging.CreateKriging(MMap.kriging.map);
            MMap.kriging.showLegend();
        });
    },
    CreateKriging: function (map) {
        let params = {
            mapCenter: [103.846958, 31.683234],
            maxValue: 100,
            krigingModel: 'exponential',//model还可选'gaussian','spherical'
            krigingSigma2: 0,
            krigingAlpha: 100,
            canvasAlpha: 0.75,//canvas图层透明度
            colors: ["#006837", "#1a9850", "#66bd63", "#a6d96a", "#d9ef8b", "#ffffbf",
                "#fee08b", "#fdae61", "#f46d43", "#d73027", "#a50026"],
        };
        let WFSVectorSource = new ol.source.Vector();
        let WFSVectorLayer = new ol.layer.Vector(
            {
                source: WFSVectorSource,
            });
        map.addLayer(WFSVectorLayer);

        //添加选择和框选控件，按住Ctrl/⌘键，使用鼠标框选采样点
        let select = new ol.interaction.Select();
        map.addInteraction(select);
        let dragBox = new ol.interaction.DragBox({
            condition: ol.events.condition.platformModifierKeyOnly
        });
        map.addInteraction(dragBox);

        for(let i =0;i<MMap.kriging.data.length;i++){
            let temp = MMap.kriging.data[i];
            let feature = new ol.Feature({
                geometry: new ol.geom.Point(ol.proj.transform([temp.latlon[0],temp.latlon[1]], 'EPSG:4326', 'EPSG:3857')),
                value: temp.value
            });
            feature.setStyle(new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 6,
                    fill: new ol.style.Fill({ color: "#00F" })
                }),
                text: new ol.style.Text({ //文本样式
                    font: '14px Calibri,sans-serif',
                    text: temp.name,
                    fill: new ol.style.Fill({
                        color: '#FFFFFF'
                    }),
                    offsetY: 15,
                    stroke: new ol.style.Stroke({
                        color: '#ffcc33',
                        width: 2
                    })
                })
            }));
            WFSVectorSource.addFeature(feature);
        }

        //设置框选事件
        let selectedFeatures = select.getFeatures();
        dragBox.on('boxend', () => {
            let extent = dragBox.getGeometry().getExtent();
            WFSVectorSource.forEachFeatureIntersectingExtent(extent, (feature) => {
                selectedFeatures.push(feature);
            });
            drawKriging(extent);
        });
        dragBox.on('boxstart', () => {
            selectedFeatures.clear();
        });

        //绘制kriging插值图
       // let canvasLayer = null;
        const drawKriging = (extent) => {
            let values = [], lngs = [], lats = [];
            selectedFeatures.forEach(feature => {
                values.push(feature.values_.value);
                lngs.push(feature.values_.geometry.flatCoordinates[0]);
                lats.push(feature.values_.geometry.flatCoordinates[1]);
            });
            if (values.length > 3) {
                let variogram = kriging.train(values, lngs, lats,
                    params.krigingModel, params.krigingSigma2, params.krigingAlpha);

                let polygons = [];
                polygons.push([[extent[0], extent[1]], [extent[0], extent[3]],
                [extent[2], extent[3]], [extent[2], extent[1]]]);
                let grid = kriging.grid(polygons, variogram, (extent[2] - extent[0]) / 200);

                let dragboxExtent = extent;
                //移除已有图层
                if (MMap.kriging.canvasLayer !== null) {
                    map.removeLayer(MMap.kriging.canvasLayer);
                }
                //创建新图层
                MMap.kriging.canvasLayer = new ol.layer.Image({
                    source: new ol.source.ImageCanvas({
                        canvasFunction: (extent, resolution, pixelRatio, size, projection) => {
                            let canvas = document.createElement('canvas');
                            canvas.width = size[0];
                            canvas.height = size[1];
                            canvas.style.display = 'block';
                            //设置canvas透明度
                            canvas.getContext('2d').globalAlpha = params.canvasAlpha;

                            //使用分层设色渲染
                            kriging.plot(canvas, grid,
                                [extent[0], extent[2]], [extent[1], extent[3]], params.colors);

                            return canvas;
                        },
                        projection: 'EPSG:3857'
                    })
                })
                //向map添加图层
                map.addLayer(MMap.kriging.canvasLayer);
            } else {
                alert("有效样点个数不足，无法插值");
            }
        }
        //首次加载，自动渲染一次差值图
        let minPoint = ol.proj.transform([103.057030, 31.345011], 'EPSG:4326', 'EPSG:3857');
        let maxPoint = ol.proj.transform([104.603126, 32.180304], 'EPSG:4326', 'EPSG:3857');

        let extent = [minPoint[0], minPoint[1], maxPoint[0], maxPoint[1]];
        WFSVectorSource.forEachFeatureIntersectingExtent(extent, (feature) => {
            selectedFeatures.push(feature);
        });
        drawKriging(extent);
    },
    showLegend:function(){
        var dataObj = [{
            tname: 'Ⅰ级预警',
            color: '#a50026',
        }, {
            tname: 'Ⅱ级预警',
            color: '#f46d43',
        }, {
            tname: 'Ⅲ级预警',
            color: '#d9ef8b',
        }, {
            tname: 'Ⅳ级预警',
            color: '#1a9850',
        }]
        if(MMap.kriging.canvas==null){
            MMap.kriging.canvas = document.createElement('canvas');
            var ctx = MMap.kriging.canvas.getContext("2d");
            var yheight = 30;
            yheight += dataObj.length * 27; //计算canvas高度
            MMap.kriging.canvas.width = 180;
            MMap.kriging.canvas.height = yheight;
    
            /*设置图例样式*/
            ctx.fillStyle = "#fff";
            ctx.fillRect(0, 0, 200, yheight); //绘制底图
            ctx.font = "16px Arial";
            ctx.fillStyle = "#000";
            ctx.fillText('气象灾害等级', MMap.kriging.canvas.width / 6, 25);
            for (var i = 0; i < dataObj.length; i++) {
                //实现文字前面带色块
                ctx.fillStyle = dataObj[i].color; //块颜色
                ctx.fillRect(10, 60 + (i - 1) * 25, 15, 15); //颜色块：x,y,w,h
    
                ctx.font = "12px Arial";
                // ctx.fillStyle = "#555";
                ctx.fillText(dataObj[i].tname, 30, 72 + (i - 1) * 25); //文字
    
                //添加图片方法一，实现文字前面带图片，移动图例不会出现闪烁
                //drawImg_first('xiushan.png', i); 
    
                //添加图片方法二，移动图例会出现闪烁
                //drawImg_Second(ctx, 'xiushan.png', i);   
            }
            $("#legend").append(MMap.kriging.canvas);
        }
    }
}