"use strict";

var Expressway = require('expressway');

/**
 * Provides helper functions for Sharp.
 * @author Mike Adamczyk <mike@bom.us>
 */
class GraphicsProvider extends Expressway.Provider
{
    /**
     * Constructor.
     * @param app Application
     */
    constructor(app)
    {
        super(app);

        this.requires = [
            'CoreProvider',
            'LoggerProvider',
        ];
    }

    /**
     * Register with the application.
     * @param app Application
     * @param event EventEmitter
     */
    register(app)
    {
        var MediaService = require('../services/MediaService');

        var mediaService = new MediaService({

            "original" : function(image,meta,Sharp) {
                // We can't be storing giant images on the server.
                // If you want to change this, go right ahead ;)
                if (meta.width > 2000) image.resize(2000);
                return image;
            },
            "thumb" : function(image,meta,Sharp) {
                return image.resize(200,150).crop(Sharp.strategy.entropy);
            },

            "medium" : function(image,meta) {
                return meta.width < 400 ? false : image.resize(400);
            },

            "large" : function(image,meta) {
                return meta.width < 800 ? false : image.resize(800);
            }
        });

        // Attach an image helper to the view.
        app.on('view.created', function(view) {
            view.data.getImage = function(name, size = "original") {
                return mediaService.url(name,size);
            }
        });

        app.register('media', mediaService, "Image manipulation service");
    }
}

module.exports = GraphicsProvider;