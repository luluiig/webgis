if (typeof MMap == "undefined") { var MMap = {}; }
MMap.heatmap = {
    map: null,//地图对象
    Init: function (map) {
        this.map = map;
        this.CreateHeatmap(map);
    },
    CreateHeatmap: function (map) {
        var count = 3000;
        var heatMapData = new ol.source.Vector();
        for (var i = 0; i < count; i++) {
            var x = Number(this.randomNum(31.692113, 31.674475, 6));
            var y = Number(this.randomNum(103.867831, 103.826697, 6));
            var pointFeature = new ol.Feature({
                geometry: new ol.geom.Point(ol.proj.transform([y, x], 'EPSG:4326', 'EPSG:3857')),
                weight: 20
            });
            heatMapData.addFeature(pointFeature);
        }
        var vector = new ol.layer.Heatmap({
            source: heatMapData,
            id: 'heat',
            weight: weightFunction,//设置权重,值在0-1之间
            gradient: ['#00f', '#0ff', '#0f0', '#ff0', '#f00'],//百度热力图风格,
            blur: 15,//默认15
            radius: 8//默认8
        });
        map.addLayer(vector);
        /*
            *设置权重
            */
        function weightFunction(feature) {
            var weight = feature.get('weight');
            weight = parseFloat(weight);
            //weight = parseFloat(weight) / 10;
            return weight;
        }
    },
    randomNum: function (maxNum, minNum, decimalNum) {
        var max = 0, min = 0;
        minNum <= maxNum ? (min = minNum, max = maxNum) : (min = maxNum, max = minNum);
        switch (arguments.length) {
            case 1:
                return Math.floor(Math.random() * (max + 1));
                break;
            case 2:
                return Math.floor(Math.random() * (max - min + 1) + min);
                break;
            case 3:
                return (Math.random() * (max - min) + min).toFixed(decimalNum);
                break;
            default:
                return Math.random();
                break;
        }
    }
}