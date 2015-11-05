import {Metadata} from "./metadata";
export class Tag {
    _id: string;
    name: string;
    totalQuestions: number;
    usageByMonth: {[monthLabel: string] : TagUsage};
    usageByWeek: {[weekLabel: string] : TagUsage};

    constructor(metadata: Metadata, apiTag) {
        Object.assign(this, apiTag);

        for (var monthLabel in this.usageByMonth) {
            this.usageByMonth[monthLabel].percentQuestions =
                this.usageByMonth[monthLabel].numQuestions / metadata.usageByMonth[monthLabel].numQuestions * 100;
        }

        for (var weekLabel in this.usageByWeek) {
            this.usageByWeek[weekLabel].percentQuestions =
                this.usageByWeek[weekLabel].numQuestions / metadata.usageByWeek[weekLabel].numQuestions * 100;
        }
    }
}

interface TagUsage {
    numQuestions: number;
    percentQuestions: number;
}