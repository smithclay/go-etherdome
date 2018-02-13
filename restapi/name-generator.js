const smells = [ 'flowers',
    'bacon',
    'bread',
    'cakes',
    'detergent',
    'candles',
    'vanilla',
    'lavender',
    'lemon',
    'chocolate',
    'barbeque',
    'babies',
    'new-car',
    'leather',
    'rain',
    'aftershave',
    'books',
    'carpet',
    'marzipan',
    'popcorn',
    'cheese',
    'cookies'];

const neighborhoods = ["alamo-square","anza-vista","ashbury-heights","balboa-hollow",
    "balboa-park","balboa-terrace","bayview","belden-place","bernal-heights","buena-vista",
    "castro","cathedral-hill","china-basin","chinatown","civic-center","clarendon-heights",
    "cole-valley","corona-heights","cow-hollow","crocker-amazon","design-district","diamond-heights",
    "dogpatch","dolores-heights","duboce-triangle","embarcadero","eureka-valley","excelsior","fillmore",
    "financial-district","fishermans-wharf","forest-hill","forest-knolls","glen-park",
    "golden-gate-heights","haight-ashbury","hayes-valley","hunters-point","india-basin",
    "ingleside","ingleside-terraces","inner-sunset","irish-hill","islais-creek","jackson-square",
    "japantown","jordan-park","laguna-honda","lakeside","lakeshore","la-lengua","lower-noe",
    "laurel-heights","lincoln-manor","little-hollywood","little-russia","little-saigon",
    "lone-mountain","lower-haight","lower-pac-heights","lower-nob-hill","marina-district",
    "merced-heights","merced-manor","midtown-terrace","mid-market","miraloma-park","mission-bay",
    "mission-district","mission-dolores","mission-terrace","monterey-heights","mount-davidson",
    "nob-hill","noe-valley","north-beach","north-of-panhandle","oceanview","outer-mission",
    "outer-sunset","pacific-heights","parkmerced","parkside","parnassus","polk-gulch","portola",
    "portola-place","potrero-hill","presidio","presidio-heights","richmond-district","rincon-hill",
    "russian-hill","saint-francis-wood","sea-cliff","sherwood-forest","silver-terrace","south-beach",
    "south-end","south-of-market","south-park","sunnydale","sunnyside","sunset-district","telegraph-hill",
    "tenderloin","treasure-island","twin-peaks","union-square","university-mound","upper-market",
    "visitacion-valley","vista-del-mar","west-portal","western-addition","westwood-highlands",
    "westwood-park","yerba-buena"];

const generate = () => {
    return `${neighborhoods[Math.floor(Math.random()*neighborhoods.length)]}-${smells[Math.floor(Math.random()*smells.length)]}-${Math.floor(1000*Math.random())}`;
};

module.exports = generate;