
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////

module egret.native2 {

    let customContext: CustomContext;

    let context: EgretContext = {

        setAutoClear: function(value:boolean):void {
            WebGLRenderBuffer.autoClear = value;
        },

        save: function () {
            // do nothing
        },

        restore: function () {
            let context = WebGLRenderContext.getInstance(0, 0);
            let gl:any = context.context;
            if(WebGLRenderContext.$supportCmdBatch) {
                gl = context.glCmdManager;
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, context["vertexBuffer"]);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, context["indexBuffer"]);
            gl.activeTexture(gl.TEXTURE0);
            context.shaderManager.currentShader = null;
            context["bindIndices"] = false;
            let buffer = context.$bufferStack[1];
            context["activateBuffer"](buffer);
            gl.enable(gl.BLEND);
            context["setBlendMode"]("source-over");
        }
    }

    function setRendererContext(custom: CustomContext) {
        custom.onStart(context);
        customContext = custom;
    }
    egret.setRendererContext = setRendererContext;

    /**
     * @private
     */
    export var $supportCanvas = egret_native.Canvas ? true : false;

    var isRunning:boolean = false;
    var playerList:Array<NativePlayer> = [];

    function runEgret(options?:{renderMode?:string;audioType?:number;screenAdapter?:sys.IScreenAdapter}) {
        if (isRunning) {
            return;
        }
        isRunning = true;
        if(!options){
            options = {};
        }
        
        /**
         * @private
         * 设置当前runtime版本是否支持cmdBatch
         */
        WebGLRenderContext.$supportCmdBatch = false;
        setRenderMode(options.renderMode);
        if (DEBUG) {
            //todo 获得系统语言版本
            var language = "zh_CN";

            if (language in egret.$locale_strings)
                egret.$language = language;
        }
        try {
            Capabilities.$setNativeCapabilities(egret_native.getVersion());
        } catch (e) {

        }
        var ticker = egret.sys.$ticker;
        var mainLoop = function() {
            if(customContext) {
                customContext.onRender(context);
            }
            
            ticker.update();
        };
        egret_native.setOnUpdate(mainLoop, ticker);
        if (!egret.sys.screenAdapter) {
            if(options.screenAdapter){
                egret.sys.screenAdapter = options.screenAdapter;
            }
            else{
                egret.sys.screenAdapter = new egret.sys.DefaultScreenAdapter();
            }
        }

        // todo
        var player = new NativePlayer();
        playerList.push(player);
        // 关闭脏矩形
        player.$stage.dirtyRegionPolicy = DirtyRegionPolicy.OFF;
        egret.sys.DisplayList.prototype.setDirtyRegionPolicy = function () {
        };
    }

    /**
     * 设置渲染模式。"auto","webgl","canvas"
     * @param renderMode
     */
    function setRenderMode(renderMode:string):void{
        sys.CanvasRenderBuffer = WebGLRenderBuffer;
        // sys.RenderBuffer = web.WebGLRenderBuffer;
        // sys.systemRenderer = new web.WebGLRenderer();
        // sys.canvasRenderer = new CanvasRenderer();
        // Capabilities.$renderMode = "webgl";

        // TODO rename
        sys.RenderBuffer = WebGLRenderBuffer;
        sys.systemRenderer = new WebGLRenderer();
        sys.canvasRenderer = new WebGLRenderer();
        sys.customHitTestBuffer = new WebGLRenderBuffer(3, 3);
        sys.canvasHitTestBuffer = new WebGLRenderBuffer(3, 3);
        Capabilities.$renderMode = "webgl";
    }

    function updateAllScreens():void {
        var length:number = playerList.length;
        for (var i:number = 0; i < length; i++) {
            playerList[i].updateScreenSize();
        }
    }

    function toArray(argument) {
        var args = [];
        for (var i = 0; i < argument.length; i++) {
            args.push(argument[i]);
        }
        return args;
    }

    egret.warn = function () {
        console.warn.apply(console, toArray(arguments))
    };
    egret.error = function () {
        console.error.apply(console, toArray(arguments))
    };
    egret.assert = function () {
        console.assert.apply(console, toArray(arguments))
    };
    if (DEBUG) {
        egret.log = function () {
            if (DEBUG) {
                var length = arguments.length;
                var info = "";
                for (var i = 0; i < length; i++) {
                    info += arguments[i] + " ";
                }
                sys.$logToFPS(info);
            }
            console.log.apply(console, toArray(arguments));
        }
    }
    else {
        egret.log = function () {
            console.log.apply(console, toArray(arguments))
        };
    }

    egret.runEgret = runEgret;
    egret.updateAllScreens = updateAllScreens;
}

module egret.native {
    export  var $supportCanvas:boolean = true;
    egret.native.$supportCanvas = egret.native2.$supportCanvas;
}
