const VariantTool = {};

//Appends card_tid to variant_tid  ("wolf_foil")
VariantTool.getTid = (card, variant) =>
{
    var cardTid = card.tid + VariantTool.getSuffix(variant);
    return cardTid;
};

VariantTool.getSuffix = (variant) =>
{
    return (variant != null && !variant.is_default) ? ("_" + variant.tid) : "";
};

VariantTool.getSuffixTid = (variant_tid, is_default) =>
{
    return (variant_tid && !is_default) ? ("_" + variant_tid) : "";
};

VariantTool.getCardTid = (tid, all_variants) =>
{
    for(var i=0; i< all_variants.length; i++)
    {
        var variant = all_variants[i];
        var suffix = VariantTool.getSuffix(variant);
        if(suffix && tid.endsWith(suffix))
            return tid.replace(suffix, "");
    }
    return tid;
};

VariantTool.getVariantTid = (tid, all_variants) =>
{
    for(var i=0; i< all_variants.length; i++)
    {
        var variant = all_variants[i];
        var suffix = VariantTool.getSuffix(variant);
        if(suffix && tid.endsWith(suffix))
            return variant.tid;
    }
    return "";
};

module.exports = VariantTool;