if (typeof MMap == "undefined") { var MMap = {}; }
MMap.statis = {
    map: null,//地图对象
    $echartDiv: null,
    dialog: null,
    myChart: null,
    data: [
        {
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
            "latlon": [103.651485, 31.825709]
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
        }
    ],
    Init: function () {
        $echartDiv = '<div id="echarts_div" style="width:600px;height:400px;"></div>';
        this.dialog = jDialog.dialog({
            title: '雨情统计表',
            width: 620,
            height: 460,
            modal: false,
            top: (document.body.clientHeight - 360) / 2,
            left: (document.body.clientWidth - 540) / 2,
            content: $echartDiv,
            events: {
                close: function () {
                    MMap.statis.dialog.hide();
                    MMap.statis.Init();
                }
            }
        });
        MMap.statis.dialog.hide();
        $("#tj").on("click", function () {
            MMap.statis.CreateCharts();
        })
    },
    CreateCharts: function () {
        MMap.statis.dialog.show();
        MMap.statis.myChart = echarts.init(document.getElementById('echarts_div'));
        var category = [];
        var dottedBase = +new Date();
        var lineData = [];
        var barData = [];
        for(var i=0; i<MMap.statis.data.length; i++){
            category.push(MMap.statis.data[i].name);
            barData.push(MMap.statis.data[i].value);
        }

        // for (var i = 0; i < 20; i++) {
        //     var date = new Date(dottedBase += 1000 * 3600 * 24);
        //     category.push([
        //         date.getFullYear(),
        //         date.getMonth() + 1,
        //         date.getDate()
        //     ].join('-'));
        //     var b = Math.random() * 200;
        //     var d = Math.random() * 200;
        //     barData.push(b)
        //     lineData.push(d + b);
        // }
        // option
        var option = {
            backgroundColor: '#0f375f',
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow',
                    label: {
                        show: true,
                        backgroundColor: '#333'
                    }
                }
            },
            legend: {
                data: ['降雨量'],
                textStyle: {
                    color: '#ccc'
                }
            },
            xAxis: {
                data: category,
                axisLine: {
                    lineStyle: {
                        color: '#ccc'
                    }
                }
            },
            yAxis: {
                name : '3小时内降雨量(mm)',
                type : 'value',
                max : 140,
                splitLine: { show: false },
                axisLine: {
                    lineStyle: {
                        color: '#ccc'
                    }
                }
            },
            series: [{
                name: '降雨量',
                type: 'bar',
                barWidth: 10,
                itemStyle: {
                    normal: {
                        barBorderRadius: 5,
                        color: new echarts.graphic.LinearGradient(
                            0, 0, 0, 1,
                            [
                                { offset: 0, color: '#14c8d4' },
                                { offset: 1, color: '#43eec6' }
                            ]
                        )
                    }
                },
                data: barData
            }]
        };
        // 使用刚指定的配置项和数据显示图表。
        MMap.statis.myChart.setOption(option);
    }
}