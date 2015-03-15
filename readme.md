### Usage

```ts
/// <reference path="fileStruct.ts" />

class Foo extends FileStruct {
    littleEndian = true;

    struct():any {
        var header = {
            code: {type: "Uint16"},
            name: {type: "String", len: 32}
        };

        var param = {
            code: {type: "Uint16"}
        };

        return {
            file_size: {type: "Uint32"},
            header: {type: amfID},
            params: {type: param, array: 16},
        };
    }
}

Foo.open(file, function (foo) {

    console.log(foo.file_size);
    console.log(foo.header);
    console.log(foo.params);

}, function () {

    console.log("error")

});

```
