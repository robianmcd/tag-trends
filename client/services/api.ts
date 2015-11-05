import {Tag} from "../models/tag";
import {Metadata} from "../models/metadata";

export class Api {
    private cachedMetadataPromise: Promise<Metadata> = this.getMetadata();

    getMatchingTags(query): Promise<Tag[]> {
        return Api.fetchJson(`api/tags?matchName=${encodeURIComponent(query)}&max=10`).then((tags) => {
            return this.cachedMetadataPromise.then((metadata) => {
                return tags.map(tag => new Tag(metadata, tag));
            });
        })
    }

    getTagByName(tagName): Promise<Tag> {
        return Api.fetchJson(`api/tagByName/${encodeURIComponent(tagName)}`).then((tag) => {
                return this.cachedMetadataPromise.then((metadata) => {
                    return new Tag(metadata, tag);
                });
            });
    }

    getMetadata(): Promise<Metadata> {
        if(this.cachedMetadataPromise === undefined) {
            this.cachedMetadataPromise = Api.fetchJson(`api/metadata`)
                .then(apiMetadata => new Metadata(apiMetadata));
        }

        return this.cachedMetadataPromise;
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

    static fetchJson(url) {
        return window.fetch(url)
            .then(Api.checkStatus)
            .then(Api.parseJson);
    }
}