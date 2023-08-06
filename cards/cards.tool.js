const config = require('../config.js');
const crypto = require('crypto');
const CardModel = require('../cards/cards.model');
const VariantModel = require('../variants/variants.model');
const VariantTool = require('../variants/variants.tool');

const CardTool = {};

CardTool.getPackCards = async(pack) =>
{
    var pack_cards = await CardModel.getByPack(pack.tid);
    var default_variant = await VariantModel.getDefault();
    var default_tid = default_variant ? default_variant.tid : "";

    var cards = [];
    for(var i=0; i<pack.cards; i++)
    {
        if(pack.random)
        {
            //Randomized set
            var rarity_tid = CardTool.getRandomRarity(pack, i==0);
            var variant_tid = CardTool.getRandomVariant(pack);
            var suffix = VariantTool.getSuffixTid(variant_tid, variant_tid == default_tid);
            var rarity_cards = CardTool.getCardArray(pack_cards, rarity_tid);
            var card = CardTool.getRandomCard(rarity_cards);
            if(card)
            {
                card.tid = card.tid + suffix;
                cards.push(card);
            }
        }
        else if(i < pack_cards.length)
        {
            //Fixed set
            var card = pack_cards[i];
            cards.push(card);
        }
    }
    return cards;
};

CardTool.getRandomRarity = (pack, is_first) =>
{
    var rarities = is_first ? pack.rarities_1st : pack.rarities;
    if(!rarities || rarities.length == 0)
        return ""; //Any rarity

    var total = 0;
    for(var rarity of rarities) {
        total += rarity.value;
    }

    var rvalue = Math.floor(Math.random()*total);

    for(var i=0; i<rarities.length; i++)
    {
        var rarity = rarities[i];
        if(rvalue < rarity.value)
        {
            return rarity.tid;
        }
        rvalue -= rarity.value;
    }
    return "";
};

CardTool.getRandomVariant = (pack) =>
{
    var variants = pack.variants;
    if(!variants || variants.length == 0)
        return "";

    var total = 0;
    for(var variant of variants) {
        total += variant.value;
    }

    var rvalue = Math.floor(Math.random()*total);

    for(var i=0; i<variants.length; i++)
    {
        var variant = variants[i];
        if(rvalue < variant.value)
        {
            return variant.tid; 
        }
        rvalue -= variant.value;
    }
    return "";
};

CardTool.getCardArray = (all_cards, rarity) =>
{
    var valid_cards = [];
    for(var i=0; i<all_cards.length; i++)
    {
        var card = all_cards[i];
        if(!rarity || card.rarity == rarity)
            valid_cards.push(card);
    }
    return valid_cards;
}

CardTool.getRandomCard = (all_cards, suffix) =>
{
    if(all_cards.length > 0)
    {
        var card = all_cards[Math.floor(Math.random()*all_cards.length)];
        var cardQ = {tid: card.tid, quantity: 1};
        return cardQ;
    }
    return null;
};

module.exports = CardTool;