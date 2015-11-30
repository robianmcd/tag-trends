import {Component, View} from 'angular2/core';

@Component({
    selector: 'tt-header'
})
@View({
    template: `
        <div class="header">
            <span class="title">
                tag-trends
                <a target="_blank" class="github fa fa-github" href="https://github.com/robianmcd/tag-trends"></a>
            </span>
        </div>
    `,
    styles: [`
        .header {
            padding: 8px;
            background-color: #D47366;
        }

        .title {
            font-size: 24px;
            line-height: 34px;
            color: white;
        }

        .github {
            color: white;
            float: right;
            line-height: 34px;
            text-decoration: none;
        }

        .github:hover {
            color:#e8e8e8;
        }
    `]

})
export class Header {
    constructor() {

    }

}
