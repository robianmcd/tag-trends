import {Tag} from "../models/tag";

export class Api {
    getMatchingTags(query): Promise<Tag[]> {
        return window.fetch(`api/tags?matchName=${encodeURIComponent(query)}&max=10`)
            .then(Api.checkStatus)
            .then(Api.parseJson);
    }

    getTagByName(tagName): Promise<Tag> {
        return window.fetch(`api/tagByName/${encodeURIComponent(tagName)}`)
            .then(Api.checkStatus)
            .then(Api.parseJson);
    }

    static checkStatus(response) {
        if (response.status >= 200 && response.status < 300) {
            return response
        } else {
            var error = new Error(response.statusText);
            error['response'] = response;
            return Promise.reject(error);
        }
    }

    static parseJson(response) {
        return response.json()
    }
}