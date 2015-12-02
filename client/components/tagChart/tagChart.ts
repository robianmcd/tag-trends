import {Component, View, Input, Output, EventEmitter} from 'angular2/core';
import {Tag} from "../../models/tag";
import Moment = moment.Moment;

declare var c3:any;

@Component({
    selector: 'tag-chart',
    providers: []
})
@View({
    template: `
        <div id="chart"></div>
    `
})
export class TagChart {
    private tags:Tag[];
    private colors:string[];
    private startDate:Moment;
    private endDate:Moment;
    private chart;
    private dataField:string;
    private labels:string[];

    constructor() {

    }

    recreate(startDate:Moment, endDate:Moment, tags:Tag[], colors:string[], dataField:string) {
        this.startDate = moment(startDate);
        this.endDate = moment(endDate);
        this.tags = tags.slice(0);
        this.colors = colors.slice(0);
        this.dataField = dataField;

        this.labels = this.generateLabels(this.startDate, this.endDate);



        var chartHeight = Math.min(400, screen.height - 180);
        chartHeight = Math.max(100, chartHeight);

        this.chart = c3.generate({
            data: {
                bindto: '#chart',
                x: 'x',
                xFormat: '%Y-%m', // 'xFormat' can be used as custom format of 'x'
                columns: []
            },
            size: {
                height: chartHeight
            },
            axis: {
                x: {
                    type: 'timeseries',
                    tick: {
                        fit: false,
                        format: '%b-%y'
                    },
                    padding: {left: 0, right: 0}
                },
                y: {
                    min: 0,
                    show: false,
                    padding: {top: 10, bottom: 0},
                }
            },
            legend: {
                show: false
            },
            tooltip: {
                format: {
                    title: (title) => {
                        var date = moment(title).format('MMM YYYY');
                        if (this.dataField === 'numQuestions') {
                            return `# of Questions (${date})`
                        } else {
                            return `% of Total (${date})`
                        }
                    },
                    value: (value) => {
                        if (this.dataField === 'numQuestions') {
                            return value;
                        } else {
                            return value.toPrecision(2) + '%';
                        }
                    }
                }
            },
            zoom: {
                enabled: true,
                rescale: true
            },
            point: {
                show: true,
                r: 0,
                focus: {
                    expand: {
                        r: 5
                    }
                }
            }
        });

        this.updateTags(this.tags);
    }

    addTagToChart(tag:Tag) {
        this.tags.push(tag);

        this.updateTags([tag]);
    }


    removeTagFromChart(tag:Tag) {
        var tagIndex = this.tags.indexOf(tag);
        if (tagIndex !== -1) {
            this.tags.splice(tagIndex, 1);
        }

        this.chart.unload({
            ids: [tag.name]
        });

        this.updateColors();
    }

    changeDataField(dataField) {
        this.dataField = dataField;
        this.updateTags(this.tags);
    }

    private updateTags(tags:Tag[]) {
        var series = tags.map((tag) => {
            var dataArray = this.generateDataArray(tag);
            return (<any>[tag.name]).concat(dataArray);
        });
        series.push(['x'].concat(this.labels));

        this.chart.load({
            columns: series,
            colors: this.getChartColorsArray()
        });
    }

    private updateColors() {
        this.chart.data.colors(this.getChartColorsArray());
    }

    private getChartColorsArray() {
        var colors = {};
        this.tags.forEach(
            (tag, index) => {
                colors[tag.name] = this.colors[index % this.colors.length];
            }
        );

        return colors;
    }

    private generateDataArray(tag:Tag) {
        return this.labels.map((label) => {
            if (tag.usageByMonth[label]) {
                return tag.usageByMonth[label][this.dataField];
            } else {
                return 0;
            }
        });
    }

    private generateLabels(startDate:Moment, endDate:Moment) {
        var curDate = moment(startDate);

        var labels = [];

        while (curDate.isBefore(endDate)) {
            labels.push(curDate.format('YYYY-MM'));
            curDate.add(1, 'month');
        }

        return labels;
    }
}