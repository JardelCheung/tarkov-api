class ItemsAPI {
    constructor(){
        this.itemCache = false;
        this.loading = false;
    }

    async init(){
        try {
            if (this.loading) await this.loading;
            if(this.itemCache){
                return true;
            }
            this.loading = ITEM_DATA.get('ITEM_CACHE_V3', 'json');
            this.itemCache = await this.loading;
            this.loading = false;
        } catch (error){
            console.error(error);
        }
    }

    formatItem(rawItem) {
        const item = {
            ...rawItem,
        };
        
        // add trader prices to sellFor
        item.sellFor = [
            ...item.traderPrices.map((traderPrice) => {
                let currency = 'RUB';
                if (traderPrice.name.toLowerCase() === 'peacekeeper') currency = 'USD';
                return {
                    price: traderPrice.price,
                    currency: currency,
                    priceRUB: traderPrice.priceRUB,
                    vendor: {
                        trader: traderPrice.trader,
                        trader_id: traderPrice.trader,
                        traderLevel: 1,
                        minTraderLevel: 1,
                        taskUnlock: null
                    },
                    source: traderPrice.name.toLowerCase(),
                    requirements: [],
                };
            }),
        ];

        item.buyFor = [];

        // add flea prices to sellFor and buyFor
        if(!item.types.includes('noFlea') && !item.types.includes('preset')){
            item.sellFor.push({
                price: item.lastLowPrice || 0,
                currency: 'RUB',
                currencyItem: '5449016a4bdc2d6f028b456f',
                priceRUB: item.lastLowPrice || 0,
                vendor: this.itemCache.flea,
                source: 'fleaMarket',
                requirements: [{
                    type: 'playerLevel',
                    value: this.itemCache.flea.minPlayerLevel,
                }],
            });

            item.buyFor.push({
                price: item.avg24hPrice || item.lastLowPrice || 0,
                currency: 'RUB',
                currencyItem: '5449016a4bdc2d6f028b456f',
                priceRUB: item.avg24hPrice || item.lastLowPrice || 0,
                vendor: this.itemCache.flea,
                source: 'fleaMarket',
                requirements: [{
                    type: 'playerLevel',
                    value: this.itemCache.flea.minPlayerLevel,
                }],
            });
        }

        return item;
    }

    async getItem(id, contains) {
        await this.init();
        if (!this.itemCache) {
            return Promise.reject(new Error('Item cache is empty'));
        }
        let item = this.itemCache.data[id];
        if(!item){
            return Promise.reject(new Error(`No item found with id ${id}`));
        }

        const formatted = await this.formatItem(item);
        if (contains && Array.isArray(contains)) {
            formatted.containsItems = contains.map((cItem) => {
                return {
                    ...cItem,
                    attributes: []
                }
            });
        }
        return formatted;
    }

    async getAllItems() {
        await this.init();
        if (!this.itemCache) {
            return Promise.reject(new Error('Item cache is empty'));
        }
        return Object.values(this.itemCache.data).map((rawItem) => {
            return this.formatItem(rawItem);
        });
    }

    async getItemsByIDs(ids, items = false) {
        await this.init();
        if (!this.itemCache) {
            return Promise.reject(new Error('Item cache is empty'));
        }
        let format = false;
        if (!items) {
            items = Object.values(this.itemCache.data);
            format = true;
        }
        return items.filter((rawItem) => {
            return ids.includes(rawItem.id);
        }).map((rawItem) => {
            if (!format) return rawItem;
            return this.formatItem(rawItem);
        });
    }

    async getItemsByType(type, items = false) {
        await this.init();
        if (!this.itemCache) {
            return Promise.reject(new Error('Item cache is empty'));
        }
        let format = false;
        if (!items) {
            items = Object.values(this.itemCache.data);
            format = true;
        }
        return items.filter((rawItem) => {
            return rawItem.types.includes(type) || type === 'any';
        }).map((rawItem) => {
            if (!format) return rawItem;
            return this.formatItem(rawItem);
        });
    }

    async getItemsByName(name, items = false, lang = 'en') {
        await this.init();
        if (!this.itemCache) {
            return Promise.reject(new Error('Item cache is empty'));
        }
        let format = false;
        if (!items) {
            items = Object.values(this.itemCache.data);
            format = true;
        }
        const searchString = name.toLowerCase();

        return items.filter((rawItem) => {
            if (!rawItem.locale || !rawItem.locale[lang]) return false;
            if (rawItem.locale[lang].name && rawItem.locale[lang].name.toString().toLowerCase().includes(searchString)) {
                return true;
            }
            if (rawItem.locale[lang].shortName && rawItem.locale[lang].shortName.toString().toLowerCase().includes(searchString)) {
                return true;
            }
            return false;
        }).map((rawItem) => {
            if (!format) return rawItem;
            return this.formatItem(rawItem);
        });
}

    async getItemsByNames(names, items = false, lang = 'en') {
        await this.init();
        if (!this.itemCache) {
            return Promise.reject(new Error('Item cache is empty'));
        }
        let format = false;
        if (!items) {
            items = Object.values(this.itemCache.data);
            format = true;
        }
        const searchStrings = names.map(name => {
            return name.toLowerCase();
        });
        console.log(lang);
        return items.filter((rawItem) => {
            if (!rawItem.locale || !rawItem.locale[lang]) return false;
            for (const search of searchStrings) {
                if (rawItem.locale[lang].name && rawItem.locale[lang].name.toString().toLowerCase().includes(search)) {
                    return true;
                }
                if (rawItem.locale[lang].shortName && rawItem.locale[lang].shortName.toString().toLowerCase().includes(search)) {
                    return true;
                }
                return false;
            }
            return false;
        }).map((rawItem) => {
            if (!format) return rawItem;
            return this.formatItem(rawItem);
        });
    }

    async getItemsByBsgCategoryId(bsgCategoryId, items = false) {
        await this.init();
        if (!this.itemCache) {
            return Promise.reject(new Error('Item cache is empty'));
        }
        let format = false;
        if (!items) {
            items = Object.values(this.itemCache.data);
            format = true;
        }
        return items.filter((rawItem) => {
            if (!rawItem.properties) {
                return false;
            }

            return rawItem.properties.bsgCategoryId === bsgCategoryId;
        }).map((rawItem) => {
            if (!format) return rawItem;
            return this.formatItem(rawItem)
        });
    }

    async getItemsInBsgCategory(bsgCategoryId, items = false) {
        await this.init();
        if (!this.itemCache) {
            return Promise.reject(new Error('Item cache is empty'));
        }
        let format = false;
        if (!items) {
            items = Object.values(this.itemCache.data);
            format = true;
        }
        const categories = [
            bsgCategoryId,
            ...this.getSubCategories(bsgCategoryId)
        ];
        return items.filter(item => {
            if (!item.properties) return false;
            return categories.includes(item.properties.bsgCategoryId);
        }).map(item => {
            if (!format) return item;
            return this.formatItem(item);
        });
    }

    getSubCategories(id) {
        const subCats = [];
        for (const catId in this.itemCache.categories) {
            const cat = this.itemCache.categories[catId];
            if (cat.parent_id === id) {
                subCats.push(cat.id);
                subCats.push(...this.getSubCategories(cat.id));
            }
        }
        return subCats;
    }

    async getItemByNormalizedName(normalizedName) {
        await this.init();
        if (!this.itemCache) {
            return Promise.reject(new Error('Item cache is empty'));
        }
        const item = Object.values(this.itemCache.data).find((item) => item.normalized_name === normalizedName);

        if (!item) {
            return null;
        }

        return this.formatItem(item);
    }

    async getItemsByDiscardLimitedStatus(limited, items = false) {
        await this.init();
        if (!this.itemCache) {
            return Promise.reject(new Error('Item cache is empty'));
        }
        let format = false;
        if (!items) {
            items = Object.values(this.itemCache.data);
            format = true;
        }
        return items.filter(item => {
            return (item.discardLimit > -1 && limited) || (item.discardLimit == -1 && !limited);
        }).map(item => {
            if (!format) return item;
            return this.formatItem(item);
        });
    }

    async getCategory(id) {
        await this.init();
        if (!this.itemCache) {
            return Promise.reject(new Error('Item cache is empty'));
        }
        return this.itemCache.categories[id];
    }

    async getCategories() {
        await this.init();
        if (!this.itemCache) {
            return Promise.reject(new Error('Item cache is empty'));
        }
        const categories = [];
        for (const id in this.itemCache.categories) {
            categories.push(this.itemCache.categories[id]);
        }
        return categories;
    }

    async getFleaMarket() {
        await this.init();
        if (!this.itemCache) {
            return Promise.reject(new Error('Item cache is empty'));
        }
        return this.itemCache.flea;
    }
}

module.exports = ItemsAPI
