import View from "../../View";
import LabelView from "../common/LabelView";
import Vector1 from "../../../model/core/geom/Vector1";
import domify from "../../DOM";
import { LocalizedLabelView } from "../common/LocalizedLabelView.js";


export class AssetLoaderStatusView extends View {
    /**
     *
     * @param {AssetManager} assetManager
     * @param {Localization} localization
     * @constructor
     */
    constructor({ assetManager, localization }) {
        super();
        const dom = domify();
        this.el = dom.addClass('ui-asset-manager-loading-status-view').el;

        this.assetManager = assetManager;


        this.pendingAssetCount = new Vector1();

        this.pendingAssetCount.process(function (v) {
            dom.setClass('finished', v === 0);
        });

        const self = this;

        this.addChild(new LocalizedLabelView({
            id: 'system_asset_loader.pending_count.label',
            localization,
            classList: ['pending']
        }));

        const vLabelPending = new LabelView(this.pendingAssetCount);


        this.__handlerAssetAdded = function () {
            self.pendingAssetCount._add(1);
        };

        this.__handlerAssetRemoved = function () {
            self.pendingAssetCount._add(-1);
        };

        this.addChild(vLabelPending);
    }


    link() {
        super.link();

        const self = this;

        self.pendingAssetCount.set(0);

        this.assetManager.requestMap.forEach(function (key, value) {
            self.__handlerAssetAdded(key, value);
        });

        this.assetManager.requestMap.on.set.add(this.__handlerAssetAdded);
        this.assetManager.requestMap.on.deleted.add(this.__handlerAssetRemoved);
    }

    unlink() {
        super.unlink();


        this.assetManager.requestMap.on.set.remove(this.__handlerAssetAdded);
        this.assetManager.requestMap.on.deleted.remove(this.__handlerAssetRemoved);
    }
}
