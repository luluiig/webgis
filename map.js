//量算工具初始化定义
var source = new ol.source.Vector();
var vector = new ol.layer.Vector({
    source: source,
    style: new ol.style.Style({
        fill: new ol.style.Fill({
            color: 'rgba(255, 255, 255, 0.2)'
        }),
        stroke: new ol.style.Stroke({
            color: '#ffcc33',
            width: 2
        }),
        image: new ol.style.Circle({
            radius: 7,
            fill: new ol.style.Fill({
                color: '#ffcc33'
            })
        })
    })
});
/**
 * Currently drawn feature.
 * @type {ol.Feature}
 */
var sketch;
/**
 * The help tooltip element.
 * @type {Element}
 */
var helpTooltipElement;
/**
 * Overlay to show the help messages.
 * @type {ol.Overlay}
 */
var helpTooltip;
/**
 * The measure tooltip element.
 * @type {Element}
 */
var measureTooltipElement;
/**
 * Overlay to show the measurement.
 * @type {ol.Overlay}
 */
var measureTooltip;
/**
 * Message to show when the user is drawing a polygon.
 * @type {string}
 */
var continuePolygonMsg = 'Click to continue drawing the polygon';
/**
 * Message to show when the user is drawing a line.
 * @type {string}
 */
var continueLineMsg = 'Click to continue drawing the line';
/**
 * Handle pointer move.
 * @param {ol.MapBrowserEvent} evt The event.
 */
var pointerMoveHandler = function (evt) {
    if (evt.dragging) {
        return;
    }
    /** @type {string} */
    var helpMsg = 'Click to start drawing';

    if (sketch) {
        var geom = (sketch.getGeometry());
        if (geom instanceof ol.geom.Polygon) {
            helpMsg = continuePolygonMsg;
        } else if (geom instanceof ol.geom.LineString) {
            helpMsg = continueLineMsg;
        }
    }
    if (helpTooltipElement) {
        helpTooltipElement.innerHTML = helpMsg;
        helpTooltip.setPosition(evt.coordinate);
        helpTooltipElement.classList.remove('hidden');
    }

};
//天地图街道图层配置
var vec_cSource = new ol.source.XYZ({
    crossOrigin: "anonymous",
    url: "http://t{0-7}.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=7786923a385369346d56b966bb6ad62f"
});
vec_cLayer = new ol.layer.Tile({
    source: vec_cSource
});
//天地图街道注记图层配置
var cva_wSource = new ol.source.XYZ({
    crossOrigin: "anonymous",
    url: "http://t{0-7}.tianditu.gov.cn/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk=7786923a385369346d56b966bb6ad62f"
});
cva_wLayer = new ol.layer.Tile({
    source: cva_wSource
});
//天地图卫星图层配置
var img_wSource = new ol.source.XYZ({
    crossOrigin: "anonymous",
    url: "http://t{0-7}.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=7786923a385369346d56b966bb6ad62f"
});
img_wLayer = new ol.layer.Tile({
    source: img_wSource
});
//天地图卫星注记图层配置
var cia_wSource = new ol.source.XYZ({
    crossOrigin: "anonymous",
    url: "http://t{0-7}.tianditu.gov.cn/DataServer?T=cia_w&x={x}&y={y}&l={z}&tk=7786923a385369346d56b966bb6ad62f"
});
cia_wLayer = new ol.layer.Tile({
    source: cia_wSource
});
map = new ol.Map({
    controls: ol.control.defaults().extend([
        new ol.control.OverviewMap()
    ]),
    layers: [vec_cLayer, cva_wLayer, vector],
    target: 'map',
    view: new ol.View({
        center: ol.proj.transform([103.819031,31.756010], 'EPSG:4326', 'EPSG:3857'),
        zoom: 11
    })
});
// 搜索覆盖物管理器，用于跟踪和清理搜索相关的覆盖物
var searchOverlayManager = (function () {
    var overlays = [];

    return {
        addOverlay: function (overlay) {
            overlays.push(overlay);
        },
        clearOverlays: function () {
            overlays.forEach(function (overlay) {
                map.removeOverlay(overlay);
            });
            overlays = [];
        }
    };
})();

/**
 * 初始化搜索功能
 * 绑定搜索按钮和回车键事件
 */
function initSearchFunction() {
    // 绑定搜索按钮点击事件
    $('#searchButton').on('click', function () {
        performSearch();
    });

    // 绑定输入框的回车键事件
    $('#searchInput').on('keypress', function (e) {
        if (e.which == 13) { // 回车键的 keycode 是 13
            performSearch();
        }
    });
}

/**
 * 执行搜索的函数
 * 使用天地图地理编码 API 根据输入的地点名称获取经纬度，并在地图上标注
 */
function performSearch() {
    var locationName = $('#searchInput').val().trim(); // 获取并清理输入的查询字符串
    if (locationName === '') {
        alert('请输入要搜索的地点名称');
        return;
    }

    // 构建地理编码 API 请求参数
    var ds = {
        keyWord: locationName,
        region: "四川省阿坝州茂县"
    };
    var fetchUrl = `https://api.tianditu.gov.cn/geocoder?ds=${encodeURIComponent(JSON.stringify(ds))}&tk=7786923a385369346d56b966bb6ad62f`;

    fetch(fetchUrl)
        .then(response => response.json())
        .then(data => {
            if (!data.location) {
                alert('未找到相关地点');
                return;
            }

            var lon = parseFloat(data.location.lon); // 经度
            var lat = parseFloat(data.location.lat); // 纬度

            // 调整地图视图到搜索结果
            var coordinate = ol.proj.fromLonLat([lon, lat]);
            map.getView().animate({
                center: coordinate,
                zoom: 16 // 设置缩放级别为16，确保搜索结果清晰可见
            });

            // 清理旧标注（仅移除搜索相关的覆盖物）
            searchOverlayManager.clearOverlays();

            // 添加文字标注框
            var markerElement = document.createElement('div');
            markerElement.innerHTML = `
                <div class="search-tooltip">
                    ${locationName}
                </div>`;
            var markerOverlay = new ol.Overlay({
                position: coordinate,
                element: markerElement,
                offset: [0, -15], // 让标注框稍微向上偏移
                positioning: 'bottom-center'
            });
            map.addOverlay(markerOverlay); // 添加文字标注框到地图
            searchOverlayManager.addOverlay(markerOverlay);

            // 添加红点标注
            var redDotElement = document.createElement('div');
            redDotElement.className = 'red-dot';

            var redDotOverlay = new ol.Overlay({
                position: coordinate,
                element: redDotElement,
                offset: [0, 0], // 红点无需偏移
                positioning: 'center-center'
            });
            map.addOverlay(redDotOverlay); // 添加红点标注到地图
            searchOverlayManager.addOverlay(redDotOverlay);
        })
        .catch(err => {
            console.error('搜索失败:', err);
            alert('搜索失败，请稍后再试');
        });
}

// 在地图初始化后调用搜索功能初始化
initSearchFunction();

//量算工具部分
map.on('pointermove', pointerMoveHandler);
map.getViewport().addEventListener('mouseout', function () {
    if (helpTooltipElement) {
        helpTooltipElement.classList.add('hidden');
    }
});
var typeSelect = document.getElementById('type');
var draw; // global so we can remove it later
/**
 * Format length output.
 * @param {ol.geom.LineString} line The line.
 * @return {string} The formatted length.
 */
var formatLength = function (line) {
    var length = ol.Sphere.getLength(line);
    var output;
    if (length > 100) {
        output = (Math.round(length / 1000 * 100) / 100) +
            ' ' + 'km';
    } else {
        output = (Math.round(length * 100) / 100) +
            ' ' + 'm';
    }
    return output;
};

/**
 * Format area output.
 * @param {ol.geom.Polygon} polygon The polygon.
 * @return {string} Formatted area.
 */
var formatArea = function (polygon) {
    var area = ol.Sphere.getArea(polygon);
    var output;
    if (area > 10000) {
        output = (Math.round(area / 1000000 * 100) / 100) +
            ' ' + 'km<sup>2</sup>';
    } else {
        output = (Math.round(area * 100) / 100) +
            ' ' + 'm<sup>2</sup>';
    }
    return output;
};
function addInteraction() {
    var type = (typeSelect.value == 'area' ? 'Polygon' : 'LineString');
    draw = new ol.interaction.Draw({
        source: source,
        type: type,
        style: new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 0.2)'
            }),
            stroke: new ol.style.Stroke({
                color: 'rgba(0, 0, 0, 0.5)',
                lineDash: [10, 10],
                width: 2
            }),
            image: new ol.style.Circle({
                radius: 5,
                stroke: new ol.style.Stroke({
                    color: 'rgba(0, 0, 0, 0.7)'
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 0.2)'
                })
            })
        })
    });
    map.addInteraction(draw);
    createMeasureTooltip();
    createHelpTooltip();
    var listener;
    draw.on('drawstart',
        function (evt) {
            // set sketch
            sketch = evt.feature;

            /** @type {ol.Coordinate|undefined} */
            var tooltipCoord = evt.coordinate;

            listener = sketch.getGeometry().on('change', function (evt) {
                var geom = evt.target;
                var output;
                if (geom instanceof ol.geom.Polygon) {
                    output = formatArea(geom);
                    tooltipCoord = geom.getInteriorPoint().getCoordinates();
                } else if (geom instanceof ol.geom.LineString) {
                    output = formatLength(geom);
                    tooltipCoord = geom.getLastCoordinate();
                }
                measureTooltipElement.innerHTML = output;
                measureTooltip.setPosition(tooltipCoord);
            });
        }, this);
    draw.on('drawend',
        function () {
            measureTooltipElement.className = 'tooltip tooltip-static';
            measureTooltip.setOffset([0, -7]);
            // unset sketch
            sketch = null;
            // unset tooltip so that a new one can be created
            measureTooltipElement = null;
            createMeasureTooltip();
            ol.Observable.unByKey(listener);
        }, this);
}
/**
 * Creates a new help tooltip
 */
function createHelpTooltip() {
    if (helpTooltipElement) {
        helpTooltipElement.parentNode.removeChild(helpTooltipElement);
    }
    helpTooltipElement = document.createElement('div');
    helpTooltipElement.className = 'tooltip hidden';
    helpTooltip = new ol.Overlay({
        element: helpTooltipElement,
        offset: [15, 0],
        positioning: 'center-left'
    });
    map.addOverlay(helpTooltip);
}

/**
 * Creates a new measure tooltip
 */
function createMeasureTooltip() {
    if (measureTooltipElement) {
        measureTooltipElement.parentNode.removeChild(measureTooltipElement);
    }
    measureTooltipElement = document.createElement('div');
    measureTooltipElement.className = 'tooltip tooltip-measure';
    measureTooltip = new ol.Overlay({
        element: measureTooltipElement,
        offset: [0, -15],
        positioning: 'bottom-center'
    });
    map.addOverlay(measureTooltip);
}

/**
 * Let user change the geometry type.
 */
typeSelect.onchange = function () {
    map.removeInteraction(draw);
    addInteraction();
};
//addInteraction();
//地图坐标显示
var mapContainer = document.getElementById('map');
mapContainer.addEventListener("mousemove", mousemove, false);
function mousemove(e) {
    // 采用屏幕坐标计算得到地图坐标
    var pos = { x: e.clientX - mapContainer.offsetLeft, y: e.clientY - mapContainer.offsetTop };//以左上为原点
    //地图大小
    var mapSize = map.getSize();
    //图片的经纬度，即左下角的经纬度和右上角的经纬度
    var temp = map.getView().calculateExtent(mapSize);
    var mapExtentL = { x: temp[0], y: temp[1] };//左下
    var mapExtentR = { x: temp[2], y: temp[3] };//右上
    //左下将坐标由3857投影转换为4326
    temp = ol.proj.transform([mapExtentL.x, mapExtentL.y], 'EPSG:3857', 'EPSG:4326');
    var mapPosL = { x: temp[0], y: temp[1] };
    //右上将坐标由3857投影转换为4326
    temp = ol.proj.transform([mapExtentR.x, mapExtentR.y], 'EPSG:3857', 'EPSG:4326');
    var mapPosR = { x: temp[0], y: temp[1] };
    pos = { lon: mapPosL.x + pos.x * (mapPosR.x - mapPosL.x) / mapSize[0], lat: mapPosR.y + pos.y * (mapPosL.y - mapPosR.y) / mapSize[1] };
    //console.log("经度："+pos.lon.toFixed(6) +" 纬度："+pos.lat.toFixed(6));
    document.getElementById('mouse-position').innerHTML = "经度：" + pos.lon.toFixed(6) + " 纬度：" + pos.lat.toFixed(6);
}
//地图比例尺
var ctl = new ol.control.ScaleLine({
    "className": "ol-custom-scaleline"
});
map.addControl(ctl);
//底图切换点击事件
$("#img").click(function () {
    $("#img .hoverType").css("background-color", "#c6e0f7");
    $("#vec .hoverType").css("background-color", "");
    map.removeLayer(vec_cLayer);
    map.removeLayer(cva_wLayer);
    map.removeLayer(img_wLayer);
    map.removeLayer(cia_wLayer);
    map.addLayer(img_wLayer);
    map.addLayer(cia_wLayer);
    if(MMap.kriging.canvasLayer!=null){
        map.removeLayer(MMap.kriging.canvasLayer);
        map.addLayer(MMap.kriging.canvasLayer);
    }
});
$("#vec").click(function () {
    $("#img .hoverType").css("background-color", "");
    $("#vec .hoverType").css("background-color", "#c6e0f7");
    map.removeLayer(vec_cLayer);
    map.removeLayer(cva_wLayer);
    map.removeLayer(img_wLayer);
    map.removeLayer(cia_wLayer);
    map.addLayer(vec_cLayer);
    map.addLayer(cva_wLayer);
    if(MMap.kriging.canvasLayer!=null){
        map.removeLayer(MMap.kriging.canvasLayer);
        map.addLayer(MMap.kriging.canvasLayer);
    }
});
//清除
$("#clearStatus").click(function () {
    //if (measureTooltipElement) {
    //measureTooltipElement.parentNode.removeChild(measureTooltipElement);
    //}		 
    //$(".tooltip tooltip-measure").remove();
    //measureTooltipElement.classList.remove('hidden');
    //measureTooltipElement = null;
    $(".tooltip-static").remove();
    map.removeOverlay(helpTooltip);
    map.removeOverlay(measureTooltip);
    map.removeInteraction(draw);
    vector.getSource().clear();
});

MMap.kriging.Init(map);
MMap.statis.Init(map);