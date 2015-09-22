/// <reference path="refs/jdataview.d.ts" />
declare var VBArray;

class FileStruct {

    // user defined
    littleEndian: boolean = false;

    fileName: string;
    fileSize: number;
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

    readStruct(struct?: any): any {
        var st = typeof struct;
        if (st === 'function' || !(st === 'object' && !!struct)) {

            return struct;

        } else if (struct['array']) {

            var n = struct['array'], cloneStruct = {}, array = [];
            for (var key in struct) if (key !== 'array') {
                cloneStruct[key] = struct[key];
            }
            for (var i = 0; i < n; i++) {
                array[i] = this.readStruct(cloneStruct);
            }
            return array;

        } else if (struct['type']) {

            var type = struct['type'];

            if (typeof type === 'string') {

                if (['String', 'Bytes'].indexOf(type) !== -1) {

                    return jDataView.prototype['get' + type].call(this.jdv, struct['len']);

                } else {

                    return jDataView.prototype['get' + type].call(this.jdv);

                }
            } else {
                return this.readStruct(type)
            }

        } else {

            var o = {};
            for (var key in struct) {
                o[key] = this.readStruct(struct[key]);
            }
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
        for (var key in o) {
            this[key] = o[key];
        }
        this.onRead();
    }

    // user defined
    onRead(): void {}

    private open(file: File, success: (self) => void, error?: (err) => void) {
        this.fileName = file.name;
        this.fileSize = file.size;
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
        var urlArray = url.split('/');
        this.fileName = urlArray[urlArray.length - 1];
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        if ('responseType' in xhr) {
            xhr.responseType = 'arraybuffer';
        }
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                this.fileSize = parseInt(xhr.getResponseHeader('Content-Length'));
                if (xhr.response) {
                    // IE10 over
                    this.openBuffer(xhr.response, success, error);
                } else if (xhr.responseBody !== void(0)) {
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
