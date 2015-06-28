/// <reference path="refs/underscore.d.ts" />
/// <reference path="refs/jdataview.d.ts" />
declare var VBArray;

class FileStruct {

    littleEndian: boolean = false; // user defined

    private jdv: jDataView;

    static open(...args: any[]) {
        var instance = new this;
        instance.open.apply(instance, args);
        return instance;
    }

    static openURL(...args: any[]) {
        var instance = new this;
        instance.openURL.apply(instance, args);
        return instance;
    }

    // user defined
    struct() {
        return {};
    }

    readStruct(struct?): any {
        if (!_.isObject(struct) || _.isFunction(struct)) {

            return struct;

        } else if (struct["array"]) {

            var n = struct["array"];
            delete struct["array"];
            return _.times(n, () => this.readStruct(struct));

        } else if (struct["type"]) {

            var type = struct["type"];

            if (_.isString(type)) {

                if (["String", "Bytes"].indexOf(type) !== -1) {

                    return jDataView.prototype["get" + type].call(this.jdv, struct["len"]);

                } else {

                    return jDataView.prototype["get" + type].call(this.jdv);

                }
            } else {
                return this.readStruct(type)
            }

        } else {

            var o = {};
            _.each(struct, (v, k) => { o[k] = this.readStruct(v) });
            return o;

        }
    }

    getStreamOffset() {
        return this.jdv.tell();
    }

    seek(byteOffset) {
        this.jdv.seek(byteOffset);
    }

    private read() {
        var o = this.readStruct(this.struct());
        _.each(o, (v, k) => { this[k] = v });
        this.onRead();
    }

    // user defined
    onRead() {}

    private open(file: Blob, success: (self) => void, error?: (err) => void) {
        var reader = new FileReader();
        reader.onload = (ev: any) => {
            this.openBuffer(ev.target.result, success, error);
        };

        reader.onerror = function (err) {
            if (error) {
                error({errorType: 'read', original: err});
            }
        };
        reader.readAsArrayBuffer(file);
    }

    private openURL(url: string, success: (self) => void, error?: (err) => void) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        if ('responseType' in xhr) {
            xhr.responseType = 'arraybuffer';
        }
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                if (xhr.response) {
                    // IE10 over
                    this.openBuffer(xhr.response, success, error);
                } else if (xhr.responseBody !== undefined) {
                    // IE9
                    this.openBuffer(VBArray(xhr.responseBody).toArray(), success, error);
                }
            }
        };
        xhr.send();
    }

    private openBuffer(buffer: any, success: (self) => void, error?: (err) => void) {
        try {
            this.jdv = new jDataView(buffer, void(0), void(0), this.littleEndian);
            this.read();
            success(this);
        } catch (err) {
            if (error) {
                error({errorType: 'parse', original: err});
            }
        }
    }
}
