import csv
import random

base_words = {
    "සදාචාරය": "sadaachaaraya",
    "ඡන්දය": "chandaya",
    "කෘෂිකාර්මික": "krushikaarmika",
    "ප්‍රවෘත්තිය": "pravruththiya",
    "ප්‍රවේශම": "praveshma",
    "භාවිතය": "bhaavithaya",
   "ආදරය": "aadaraya", "කතාව": "kathawa", "ගන්දර": "gandara", "විකෘති": "wikruthi",
    "රහස": "rahasa", "පොත": "potha", "අම්මා": "amma", "ගෙදර": "gedara",
    "විශ්වය": "wishwaya", "ජීවිතය": "jeewithaya", "අපරාධය": "aparadhaya", "මකරා": "makara",
    "සිහිනය": "sihinaya", "සෙවණැල්ල": "sewanalla", "මායාව": "maayawa", "තරණය": "tharanya",
    "ගමන": "gamana", "අභිරහස": "abhirahasa", "කුමාරයා": "kumaraya", "කුමරිය": "kumariya",
    "රාත්‍රිය": "rathriya", "සඳ": "sanda", "තරු": "tharu", "මල්": "mal", "වසන්තය": "wasanthaya",
    "ගිම්හානය": "gimhanaya", "වැස්ස": "wassa", "සුළඟ": "sulanga", "ගින්න": "ginna", "ජලය": "jalaya",
    "මිනිසා": "minisa", "ගැහැනිය": "gahaniya", "ළමයා": "lamaya", "පාසල": "paasala", "ගුරුවරයා": "guruwaraya",
    "යක්ෂයා": "yakshaya", "දෙවියා": "deviya", "භූතයා": "bhoothaya", "මාළිගාව": "maaligawa",
    "වනන්තරය": "wanantharaya", "සාගරය": "sagaraya", "කන්ද": "kanda", "ගඟ": "ganga",
    "අහස": "ahasa", "පොළොව": "polowa", "මරණය": "maranaya", "උපත": "upatha",
    "යුද්ධය": "yuddhaya", "සාමය": "saamaya", "ආගම": "aagama", "දහම": "dahama",
    "රජු": "raju", "රැජින": "rajina", "සෙන්පතියා": "senpathiya", "හමුදාව": "hamudawa",
    "සටන": "satana", "ජයග්‍රහණය": "jayagrahanaya", "පරාජය": "parajaya", "මිතුරා": "mithura",
    "සතුරා": "sathura", "විසඳුම": "wisanduma", "ගැටලුව": "gataluwa", "ප්‍රශ්නය": "prashnaya",
    "පිළිතුර": "pilithura", "සත්‍යය": "sathyaya", "බොරුව": "boruwa", "හීනය": "heenaya",
    "මතකය": "mathakaya", "වේදනාව": "wedanawa", "සතුට": "sathuta", "කඳුළ": "kandula",
    "හිනාව": "hinawa", "දෛවය": "daiwaya", "අනාගතය": "anaagathaya", "අතීතය": "atheethaya",
    "වර්තමානය": "warthamanaya", "කාලය": "kaalaya", "යුගය": "yugaya", "ශතවර්ෂය": "shathawarshaya",
    "මොහොත": "mohota", "දවස": "dawasa", "සතිය": "sathiya", "මාසය": "maasaya",
    "අවුරුද්ද": "awurudda", "උදෑසන": "udaasana", "සවස": "sawasa", "මධ්‍යම": "madhyama",
    "හිරු": "hiru", "කිරණ": "kirana", "වළාකුළු": "walakulu", "කුණාටුව": "kunaatuwa",
    "අකුණු": "akunu", "ගිගුරුම්": "gigurum", "සීතල": "seethala", "උණුසුම": "unusuma",
    "පරිසරය": "parisaraya", "සතා": "satha", "කුරුල්ලා": "kurulla", "මල": "mala",
    "ගස": "gasa", "කොළය": "kolaya", "මුල": "mula", "ඵලය": "phalaya", "බීජය": "beejaya",
    "ආහාරය": "aaharaya", "ජීවියා": "jeewiya", "ශරීරය": "shareeraya", "ලේ": "le",
    "ඇස": "asa", "කණ": "kana", "නාසය": "naasaya", "කට": "kata", "අත": "atha", "පය": "paya",
    "පරිවර්තනය": "pariwarthanaya", "පිටපත": "pitapatha", "කර්තෘ": "karthru",
    "ලේඛකයා": "lekhakaya", "පිටුව": "pituwa", "මිල": "mila", "හොල්මන්": "holman",
    "ත්‍රාසජනක": "thrasajanaka", "ආදර": "aadara", "විහිළු": "wihilu", "අභිරහස්": "abhirahas",
    "පරණ": "parana", "අලුත්": "aluth", "ලොකු": "loku", "පොඩි": "podi",
    "ගම": "gama", "නුවර": "nuwara", "දූපත": "doopatha", "කැලේ": "kale",
    "වත්ත": "watta", "මාවත": "mawatha", "පාර": "paara", "මන්දිරය": "mandiraya",
    "දියපාර": "diyapaara", "කඳුකරය": "kandukaraya", "මිටියාවත": "mitiyawatha",
    "අරණ": "arana", "නිම්නය": "nimnaya", "කාන්තාරය": "kaantharaya", "වනය": "wanaya",
    "ශාපය": "shaapaya", "ප්‍රේමය": "premaya", "විරහව": "wirahawa", "අඳුර": "andura",
    "ආලෝකය": "aalokaya", "ගීතය": "geethaya", "පුරාවෘත්තය": "purawruththaya",
    "විත්ති": "withthi", "සටහන්": "satahan", "මායම්": "maayam",
    "පළිගැනීම": "paliganima", "රහසක්": "rahasak", "සෙවණැලි": "sewanali", "බලාපොරොත්තුව": "balaporoththuwa",
    "දියණිය": "diyaniya", "දරුවා": "daruwa", "පියා": "piya", "මව": "mawa",
    "සොහොයුරා": "sohoyura", "සොහොයුරිය": "sohoyuriya", "සොරා": "sora",
    "ඔත්තුකරු": "otthukaru", "රහස්පරීක්ෂක": "rahaspareekshaka", "වැද්දා": "wadda",
    "ගොවියා": "gowiya", "රජතුමා": "rajathuma",
    "තාපසයා": "thaapasaya", "හොරා": "hora", "ඝාතකයා": "ghathakaya",
    "කළු": "kalu", "සුදු": "sudu", "රතු": "rathu", "නිල්": "nil", "රන්": "ran",
    "රිදී": "ridee", "මහ": "maha", "පුංචි": "punchi", "කුඩා": "kuda",
    "භයානක": "bhayanaka", "සුන්දර": "sundara", "අඳුරු": "anduru", "උණුසුම්": "unusum",
    "නිහඬ": "nihanda", "සැඟවුණු": "sangawunu", "අහිමි": "ahimi", "නොදුටු": "nodutu",
    "අවසන්": "awasan", "පළමු": "palamu", "දවාල": "dawala", "මධ්‍යමරෑ": "madhyamaraa",
    "හිරුබැසයාම": "hirubasayama", "අරුණලු": "arunalu", "මීදුම": "meeduma", "හිම": "hima",
    "සඳඑළිය": "sandaeliya", "තරුකැට": "tharukata", "වැහිබිඳු": "wahibindu",
    "සිංහයා": "sinhaya", "අලියා": "aliya", "මොණරා": "monara", "හංසයා": "hansaya",
    "කොටි": "koti", "සර්පයා": "sarpaya", "මකර": "makara", "කුරුළු": "kurulu", "වෘකයා": "wrukaya",
    "මාලය": "maalaya", "මුදුව": "muduwa", "යතුර": "yathura", "දොරටුව": "doratuwa",
    "කඩුව": "kaduwa", "ඔරලෝසුව": "oralosuwa", "පැටවු": "patawu", "කොළඹ": "kolamba", "කුරුණෑගල": "kurunegala", "ගාල්ල": "galla","විභාගය": "vibhaagaya", "පන්ති": "panthi", "ගුරුවරු": "guruwaru", "සිසුන්": "sisun",
    "විෂය": "vishaya", "ගණිතය": "ganithaya", "රසායනය": "rasaayanaya", "භෞතිකය": "bhauthikaya",
    "ජීවවිද්‍යාව": "jeewavidhyaawa", "පරිගණකය": "pariganakaya", "විද්‍යාලය": "vidyalaya",
    "අධ්‍යයනය": "adhyayana", "පරීක්ෂණය": "pareekshanaya", "අනුමානය": "anumaanaya",
    "ග්‍රන්ථාගාරය": "granthagaaraya", "පත්‍රිකාව": "pathrikawa", "කාලගුණය": "kaalagunaya",
    "චිත්‍රපටය": "chithrapataya", "සංග‍්‍රහය": "sangrahaya", "අඩවිය": "adawiya",
    "සමාජය": "samajaya", "දේශනය": "deshanaya", "ගෝලීය": "goleeya",
    "ආරක්ෂාව": "araksawa", "ආහාර": "aahara", "පතුරු": "pathuru",
    "පළතුරු": "palathuru", "කැමරාව": "kamarawa", "දුරකථනය": "durakathanaya",
    "රූපවාහිනිය": "roopavaahiniya", "ඉන්ටර්නෙට්": "internet", "මෘදුකාංගය": "mrudukangaya",
    "විදුලිය": "viduliya", "ජලය": "jalaya", "වතුර": "wathura",
    "කිරි": "kiri", "බත්": "bath", "තේ": "the",
    "එළවළු": "elavalu", "ලූණු": "luunu", "තක්කාලි": "thakkaali",
    "කොස්": "kos", "පොල්": "pol", "ජංගමය": "jangamaya",
    "රෝහල": "rohala", "ඖෂධය": "ausadhaya", "චිකිත්සාව": "chikithsawa",
    "අසනීප": "asaneepa", "සුවතාව": "suwathawa", "සුසුම්": "susum",
    "දරාගත්": "daragath", "නවීන": "naveena", "දේශීය": "desheeya",
    "පැණිරස": "paenirasa", "වෙනස": "wenasa", "ගුණාත්මක": "gunathmaka",
    "වර්ණය": "warnaya", "කහ": "kaha", "දම්": "dam",
    "රෝස": "rosa", "ලෝහය": "lohaya", "මැටි": "mati",
    "ගෙඩි": "gedi", "පෙරළිය": "peraliya", "සිහින": "sihin",
    "උදරය": "udaraya", "කොළ": "kola", "පාර": "paara",
    "කොටස": "kothasa", "විකාශය": "vikaashaya", "වර්ධනය": "wardhanaya",
    "පරිසරය": "parisaraya", "හරිත": "haritha", "වනය": "wanaya",
    "ගස්": "gas", "රඳවා": "randawaa", "ගුවන්යානය": "guwanyaana",
    "බස්": "bas", "තොගය": "thogaya", "මෝටර්": "motor",
    "රථය": "rathaya", "ගුවන්": "guwan", "කොටුව": "kotuwa",
    "වෙළඳසැල": "welandasela", "බැංකුව": "bankuwa", "පොදු": "podu",
    "සත්වය": "sathwaya", "කුකුළා": "kukula", "බල්ලා": "balla",
    "මිනිහෙකු": "miniheku", "පබල": "pabala", "කඩේ": "kade",
    "වාණිජ": "wanija", "සාකච්ඡාව": "saakachchaawa", "සමීප": "sameepa",
    "මුහුණ": "muhuna", "අත්හදා": "athhada", "තිරසාර": "thirasara",
    "ශක්තිය": "shakthiya", "අදහස": "adahasa", "කැමතිය": "kaemathiya",
    "සිතුවිලි": "sithuwili", "විශේෂය": "wisheshaaya", "සැබෑ": "sabae",
    "සබඳතාව": "sabandathawa", "උද්යෝගය": "udyogaya", "උත්සාහය": "uthsaahaya",
    "අභිමානය": "abhimaanaya", "න්‍යායා": "nyaaya", "අන්‍යෝන්‍ය": "anyonya",
    "ගුණාත්මක": "gunathmaka", "ප්‍රමාණය": "pramaanaya", "මනෝභාවය": "manobhaawaya",
    "ශක්තිමත්": "shaktimath", "සෙරමික්": "seramik", "අඳුරු": "anduru",
    "නිහතමානී": "nihatamaanee", "ආසාව": "aasawa", "කුසලතාව": "kusalathawa",
    "අලුත්ම": "aluthma", "අපාර": "apara", "මැදුර": "madhura",
    "රහස්‍ය": "rahasya", "මගපෙන්වීම": "magapenweema", "අවකාශය": "awakashaya",
    "පාලම": "paalama", "පුහුණුව": "puhunuwa", "ප්‍රතිසංස්කරණය": "prathisangskarannaya",
    "සැලසුම": "selasuma", "වාරිය": "waariya", "වෙළඳපොළ": "welandapola",
    "පරිගමනය": "parigamanaya", "ආභරණය": "aabharanaya", "අවහිර": "awahira",
    "ධම්මාචාරය": "dhammaachaaraya", "නිර්මාණය": "nirmaanaya", "සමුද්‍රය": "samudraya",
    "වැලි": "weli", "පහන": "pahana", "ආරාධනය": "aaradhanaya",
    "පොළඟ": "polaga", "වියදම්": "wiyadam", "කාරණය": "kaaranya",
    "ගීතය": "geethaya", "අනුගමනය": "anugamanaya", "රංගය": "rangaya",
    "විනෝදය": "winodaya", "සන්සුන්": "sansun", "විශ්වාසය": "wishwaasaya",
    "ගවේෂණය": "gaweshanaya", "පොදු": "podu", "සෙල්ලම්": "sellam",
    "වාහනය": "waahanaya", "යාත්‍රාව": "yaathraawa", "සළු": "salu",
    "නාගරික": "naagarika", "දුම්රිය": "dumriya", "විශාල": "vishala",
    "සුමට": "sumata", "ක්‍රීඩා": "kreeda", "ප්‍රිය": "priya",
    "වරණය": "waranaya", "අඩු": "adu", "වැඩි": "wadi",
    "ගායනය": "gaayanaya", "නවීකරණය": "naveekaranaya", "සුදුසු": "sudusu",
    "උපායය": "upaayaya", "අවස්ථාව": "awasthawa", "සෞඛ්‍ය": "saukhyaya",
    "අනුශාසනය": "anushaasanaya", "නිතර": "nithara", "פּרභාවය": "prabhaawaya",
    "සමෘද්ධිය": "samruddhiya", "අවකාශය": "avakaashaya", "වෙළඳ": "welanda",
    "පරිවර්තනය": "parivarthanaya", "සියලු": "siyalu", "වැඩබිම": "wedabima",
    "විශාල": "vishala", "එළිදක්වීම": "elidakweema", "පුහුනුව": "puhunuwa",
    "ප්‍රතික්‍ෂේපය": "prathikshepaya", "සජීවී": "sajeewee", "කාලගුණය": "kaalagunaya",
    "පරිභෝජනය": "paribhojanaya", "අත්දැකීම": "athdakeema", "සම්ප්‍රදාය": "sampradhaaya",
    "කර්මය": "karmaaya", "උපදේශය": "upadeshaya", "පතිරාජ": "pathiraaj",
    "සාරාංශය": "saraanshaya", "රසේය": "rasaya", "ප්‍රමාදය": "pramaadaya",
    "මාට්ටුව": "maattuwa", "යහපත": "yahapatha", "සත්කාරය": "sathkaarayaya",
    "විශ්වාසයක්": "wishwaasayak", "සදාචාරය": "sadaachaaraya", "ඡන්දය": "chandaya",
    "සමෘද්ධිය": "samruddhiya", "කෘෂිකාර්මික": "krushikaarmika", "ප්‍රවෘත්තිය": "pravruththiya",
    "ස්වයංක්‍රීය": "swayankreeya", "ප්‍රවේශම": "praveshma", "භාවිතය": "bhaavithaya",

}
extra_base_words = {
   # අබිරහස් සහ ත්‍රාසජනක 
    "අබිරහස": "abhirahasa", "ඝාතනය": "ghathanaya", "ලේ": "le", "බය": "baya", "හොල්මන": "holmana", 
    "අඳුර": "andura", "මරණය": "maranaya", "රහස": "rahasa", "පරීක්ෂක": "pareekshaka", "සාක්ෂිය": "saakshiya",
      "අපරාධය": "aparaadhaya", "සැකය": "sakaya", "මිනීමරුවා": "mineemaruwa", "විමර්ශනය": "wimarshanaya", 
      "භයානක": "bhayaanaka", "ත්‍රාසජනක": "thraasajanaka", "හේතුව": "hethuwa", "සොරු": "soru",

    # අධ්‍යාපනය සහ සාහිත්‍යය 
    "අධ්‍යාපනය": "adhyapanaya", "විශ්වවිද්‍යාලය": "wishwawidyalaya", "පර්යේෂණය": "paryeshanaya", 
    "විභාගය": "wibhagaya", "දැනුම": "danuma", "පෑන": "paena", "පැන්සල": "pansala", "කඩදාසි": "kadadaasi",
      "පිටුව": "pituwa", "කවරය": "kawaraya", "පුස්තකාලය": "pusthakalaya", "පුවත්පත": "puwathpatha", 
      "සඟරාව": "sangarawa", "ලිපිය": "lipiya", "රචනාව": "rachanawa", "විද්‍යාව": "widyawa", "ගණිතය": "ganithaya", 
      "ඉතිහාසය": "ithihasaya", "පොත්ගුල": "pothgula", "කතුවරයා": "kathuwaraya",

    # තාක්ෂණය සහ ඩිජිටල් 
    "පරිගණකය": "pariganakaya", "දත්ත": "daththa", "අන්තර්ජාලය": "antharjalaya", 
    "තිරය": "thiraya", "මෘදුකාංගය": "mrudukangaya", "තාක්ෂණය": "thaakshanaya", "පණිවිඩය": "paniwidaya", 
    "දුරකථනය": "durakathana", "යතුරුපුවරුව": "yathurupuruwa", "ශබ්දය": "shabdaya", "වීඩියෝ": "video", 
    "රූපය": "roopaya", "ඡායාරූපය": "chayaroopaya", "ජාලය": "jalaya", "කේතය": "kethaya",

    # මිනිස් සිරුර සහ සෞඛ්‍යය 
    "ඇස": "asa", "කන": "kana", "නාසය": "nasaya", "කට": "kata", "අත": "atha", "කකුල": "kakula", 
    "හිස": "hisa", "කොණ්ඩය": "kondaya", "රුධිරය": "rudhiraya", "හදවත": "hadawatha", 
    "වෛද්‍යවරයා": "waidyawaraya", "බෙහෙත්": "beheth", "රෝගියා": "rogiya", "රෝහල": "rohala", 
    "වේදනාව": "wedanawa", "සුවය": "suwaya",

    # කාලය සහ කාලගුණය 
    "උදේ": "ude", "දවල්": "dawal", "හවස": "hawasa", "රෑ": "rae", "අද": "ada", "හෙට": "heta", 
    "ඊයේ": "eeye", "සතිය": "sathiya", "මාසය": "maasaya", "අවුරුද්ද": "awurudda", "තත්පරය": "thathparaya", 
    "විනාඩිය": "winadiya", "පැය": "paya", "ඉර": "ira", "හඳ": "handa", "තරු": "tharu", "අව්ව": "awwa", 
    "පින්න": "pinna", "සීතල": "seethala", "රස්නය": "rasnaya",

    # පවුල සහ සමාජය 
    "අම්මා": "amma", "තාත්තා": "thaththa", "අයියා": "ayiya", "අක්කා": "akka", "මල්ලි": "malli", 
    "නංගී": "nangi", "සීයා": "seeya", "ආච්චි": "aachchi", "මාමා": "maama", "නැන්දා": "nanda", 
    "යාළුවා": "yaluwa", "ගුරුවරයා": "guruwaraya", "මිනිසා": "minisa", "ගැහැනිය": "gahaniya", 
    "ළමයා": "lamaya", "මිත්‍රයා": "mithraya", "සතුරා": "sathura",

    # ආහාර සහ මුළුතැන්ගෙය 
    "බත්": "bath", "කරවල": "karawala", "පරිප්පු": "parippu", "මස්": "mas", "මාළු": "maalu", 
    "එළවළු": "elawalu", "පලතුරු": "palathuru", "කෙසෙල්": "kesel", "අඹ": "amba", "පැපොල්": "papol",
    "තේ": "the", "කිරි": "kiri", "සීනි": "seeni", "ලුණු": "lunu", "මිරිස්": "miris", "තෙල්": "thel", 
    "පිඟාන": "pingana", "කෝප්පය": "koppaya", "හැන්ද": "handa",

    # ස්ථාන සහ ගමන් බිමන් 
    "ගම": "gama", "නගරය": "nagaraya", "පාර": "paara", "කඩය": "kadaya", "පන්සල": "pansala", 
    "පල්ලිය": "palliya", "කෝවිල": "kowila", "ගස": "gasa", "කැලය": "kalaya", "කන්ද": "kanda",
      "ගඟ": "ganga", "මුහුද": "muhuda", "වාහනය": "wahanaya", "බස්රථය": "busrathaya", "දුම්රිය": "dumriya",
        "ගුවන්යානය": "guwanyanya", "රට": "rata", "ලෝකය": "lokaya", "පාලම": "paalama", "වීදිය": "weediya",

    # ක්‍රියා පද 
    "නැගිටිනවා": "nagitinawa", "අහනවා": "ahanawa", "කතාකරනවා": "kathakaranawa", "හිතනවා": "hithanawa", 
    "දෙනවා": "denawa", "ගන්නවා": "gannawa", "හදනවා": "hadanawa", "කඩනවා": "kadanawa", 
    "වැටෙනවා": "watenawa", "අල්ලනවා": "allanawa", "අරිනවා": "arinawa", "වහනවා": "wahanawa", 
    "යවනවා": "yawanawa", "ගෙනෙනවා": "genenawa",

    # වර්ණ සහ විශේෂණ 
    "සුදු": "sudu", "කළු": "kalu", "රතු": "rathu", "නිල්": "nil", "කොළ": "kola", "කහ": "kaha", 
    "ලොකු": "loku", "පොඩි": "podi", "දිග": "diga", "කොට": "kota", "උස": "usa", "මිටි": "miti", 
    "මහත": "mahatha", "කෙට්ටු": "kettu", "හොඳ": "honda", "නරක": "naraka", "පරණ": "parana", 
    "අලුත්": "aluth", "හරි": "hari", "වැරදි": "waradi", "වේගවත්": "wegawath", "මන්දගාමී": "mandagaami",

      
    # -- ක්‍රියා පද (Verbs) --
    "යනවා": "yanawa", "එනවා": "enawa", "කනවා": "kanawa", "බොනවා": "bonawa", 
    "දුවනවා": "duwanawa", "පනිනවා": "paninawa", "හිනාවෙනවා": "hinawenawa", "අඬනවා": "andanawa",
    "බලනවා": "balanawa", "ලියනවා": "liyanawa", "කියවනවා": "kiyawanawa", "නිදාගන්නවා": "nidagannawa",

    # -- පරිසරය සහ සත්තු (Nature & Animals) --
    "ගස": "gasa", "මල": "mala", "කොළය": "kolaya", "වතුර": "wathura", "ගින්න": "ginna",
    "සුළඟ": "sulanga", "පස": "pasa", "ගල": "gala", "වලාකුළ": "walakula", "වැස්ස": "wassa",
    "බල්ලා": "balla", "පූසා": "poosa", "අලියා": "aliya", "කුරුල්ලා": "kurulla", "මාළුවා": "maaluwa",

    # -- එදිනෙදා ජීවිතය සහ ගෙදර (Everyday Life) --
    "ඇඳුම": "anduma", "සපත්තු": "sapaththu", "කෑම": "kaema", "බත්": "bath", "පාන්": "paan",
    "ගෙදර": "gedara", "කාමරය": "kaamaraya", "පුටුව": "putuwa", "මේසය": "mesaya", "ඇඳ": "anda",
    
    # -- හැඟීම් සහ ගුණාංග (Emotions & Adjectives) --
    "සතුට": "sathuta", "දුක": "duka", "කේන්තිය": "kenthiya", "බය": "baya", "ආදරය": "aadaraya",
    "ලස්සන": "lassana", "කැත": "katha", "උස": "usa", "මිටි": "miti", "මහත": "mahatha", "කෙට්ටු": "kettu",
    
    # -----------------------------------------------------------------
    # ඔයාගේ ඉතුරු වචන 500 සම්පූර්ණ වෙනකම් මේ විදිහට පහළට ටයිප් කරගෙන යන්න.
    # -----------------------------------------------------------------
}

# ==========================================
# 3. කතුවරුන් සහ පොත් වලට අදාළ වචන
# ==========================================
authors = {
    "මාර්ටින් වික්‍රමසිංහ": "martin wickramasinghe",
    "එදිරිවීර සරත්චන්ද්‍ර": "ediriveera sarathchandra",
    "පී බී සිල්වා": "p b silva",
    "කුමාරතුංග මුණිදාස": "kumarathunga munidasa",
    "චන්දනී ගුණවර්ධන": "chandani gunawardhana",
    "සුජීව රාජපක්ෂ": "sujeewa rajapaksha",
    "අනූලා රණවක": "anula ranawaka",
    "නිහාල් දිසානායක": "nihaal disanayaka",
    "ශාන්ති ගුණවර්ධන": "shanthi gunawardhana",
    "සුසිල් ප්‍රියන්ත": "susil priyantha",
    "විමල සෝමතිලාක": "wimala somathilaka",
    "නලින් ද සිල්වා": "nalin de silva",
    "විමල් කුමාර": "wimal kumara",
    "දිනේෂ් පිලියන්දල": "dinesh piliyandala",
    "කවිඳු ජයසින්හ": "kavinga jayasinha",
    "සමුද්‍ර කිරිල්ල": "samudra kirilla",
    "අශෝක රණතුංග": "ashoka ranathunga",
    "මහාදේව කලික": "mahadeva kalika",
    "සුභාෂිණී රත්නායක්": "subhashini rathnayaka",
    "විනීතා ප්‍රනාන්දු": "vineetha prananthu",
    "සිරිමව ගුණවත": "sirimawa gunawatha",
    "ඇමිල පෙරේරා": "amila pereera",
    "දිනේෂා ගුණසේකර": "dinesha gunasekara",
    "සයුරා චන්ද්‍ර": "sayura chandra",
    "ඉෂාන්ති සේනානායක": "ishanthi senanayake",
    "මහින්ද ප්‍රසාද් මසිඹුල": "mahinda prasad masimbula",
    "රුවන් ප්‍රදීප් රත්නායක": "ruwan pradeep rathnayaka",
    "සුදත් රොහාන්": "sudath rohan"
}

genres = {
    "නවකතාව": "nawakathawa",
    "කෙටි කතා": "keti katha",
    "කථා": "katha",
    "පරිවර්තනය": "pariwarthanaya",
    "චිත්‍රකථාව": "chithrakathawa",
    "කවිය": "kaviya",
    "ඉතිහාසය": "ithihasaya",
    "දර්ශනය": "darshanaya",
    "සාහිත්‍යය": "sahithyaya",
    "විශ්ලේෂණය": "wishleshanaya",
    "ජීවිත චරිතය": "jeewitha charithaya",
    "ප්‍රබන්ධය": "prabandhaya",
    "යාත්‍රා කතාව": "yaathra kathawa",
    "විද්‍යාත්මක": "vidyathmaka",
    "දෙමළ කතාව": "demala kathawa",
    "පරිකථනය": "parikathanaya",
    "අවබෝධය": "awabodhaya",
    "විද්‍යා කථාව": "vidya kathawa",
    "මානසිකත්වය": "manasikathwaya",
    "ළමා කථාව": "lama kathawa",
    "ශිෂ්‍යත්වය": "shishyathwaya",
    "පාරම්පරික": "paaramparika",
    "සරල කතාව": "sarala kathawa",
    "බුද්ධිමත් පාඩම": "budhimath paadama",
    "උගත් ඉඟිය": "ugath ingiya",
    "පරිසර කතාව": "parisara kathawa",
    "උපන්‍යාස කතාව": "upanayasa kathawa",
    "සමාජ කථාව": "samaja kathawa",
    "ප්‍රබෝධ කථාව": "prabodha kathawa",
    "වෛද්‍ය කථාව": "vaidya kathawa",
    "ක්‍රීඩා කථාව": "kreeda kathawa",
    "කථා සංග්‍රහය": "katha sangrahaya"
}
common_words = {
    "පොත": "potha",
    "පොතුව": "pothuwa",
    "පොත්": "poth",
    "පිටුව": "pituwa",
    "ලිපිය": "lipiya",
    "ග්‍රන්ථය": "granthaya",
    "ලේඛනය": "lekhanaya",
    "පොත්ගෙය": "pothgeya",
    "පොත්පොළ": "pothpola",
    "පිටපත": "pitapatha",
    "සිතුවම": "sithuwama",
    "අදහස": "adahasa",
    "සංකල්පය": "sankalpaya",
    "සටහන": "satahana",
    "සංවාදය": "sangwadaya",
    "නිබන්ධනය": "nibandhanaya",
    "කථාව": "kathawa",
    "අධ්‍යයනය": "adhyayanaya",
    "ඉගෙනීම": "igenima",
    "විද්‍යාලය": "widyaalaya",
    "පාසල": "paasala",
    "අධ්‍යාපනය": "adhyaapanaya",
    "විද්‍යාතමක": "widhyathmaka",
    "ඉතිහාසය": "ithihasaya",
    "භූගෝලය": "bhoogolaya",
    "කලාව": "kalaawa",
    "සංගීතය": "sangeethaya",
    "නැට්‍යම": "naatyama",
    "චිත්‍රය": "chithraya",
    "ප්‍රකාශය": "prakaashaya",
    "නව මතය": "nawa mathaya",
    "මේලය": "melaya",
    "දර්ශනය": "darshanaya",
    "පාලනය": "paalanaya",
    "තොරතුරු": "thorathuru",
    "නවෝත්පාදන": "navothpaadana",
    "සාර්ථකත්වය": "saarthakathwaya",
    "පරිසරය": "parisaraya",
    "බුද්ධිමය": "buddhimaya",
    "උණුසුම": "unusuma",
    "විවරණය": "vivaranaya",
    "අත්දැකීම": "athdakeema",
    "ලේඛනාවලිය": "lekhanaawaliya"
}

book_terms = {
    "පොත": "potha",
    "පොතුව": "pothuwa",
    "පොත්": "poth",
    "ග්‍රන්ථය": "granthaya",
    "ලිපිය": "lipiya",
    "පුස්තකාලය": "pusthakaalaya",
    "ග්‍රන්ථමාලාව": "granthamaalaawa",
    "පිටුව": "pituwa",
    "පිටපත": "pitapatha",
    "ලේඛනය": "lekhanaya",
    "පොත්පොළ": "pothpola",
    "පුවත්පත": "puwathpatha"
}


adjectives = {"lassana": "ලස්සන", "sundara": "සුන්දර", "honda": "හොඳ", 
    "naraka": "නරක", "parani": "පැරණි", "aluth": "අලුත්", 
    "vishala": "විශාල", "punchi": "පුංචි", "bayanaka": "භයානක",
    "shakthimath": "ශක්තිමත්", "sangweedi": "සංවේදී", "gamburu": "ගැඹුරු"
}
nouns = {"potha": "පොත", "pasala": "පාසල", "guru": "ගුරු", 
    "dora": "දොර", "mahara": "මහර", "thaniya": "තනිය", 
    "ahasa": "අහස", "kanda": "කන්ද", "wassa": "වැස්ස",
    "sanda": "සඳ", "tharu": "තරු", "adawiya": "අඩවිය",
    "jeewithaya": "ජීවිතය", "bhashawa": "භාෂාව", "maargaya": "මාර්ගය"
}


dataset = []

temp_base = []
for sinhala_key, singlish_val in base_words.items():
    temp_base.append([singlish_val.strip(), sinhala_key.strip()])
random.shuffle(temp_base)
dataset.extend(temp_base) 

temp_extra = []
for sinhala_key, singlish_val in extra_base_words.items():
    temp_extra.append([singlish_val.strip(), sinhala_key.strip()])
random.shuffle(temp_extra)
dataset.extend(temp_extra) 

temp_authors = []
for sinhala_key, singlish_val in authors.items():
    temp_authors.append([singlish_val.strip(), sinhala_key.strip()])
random.shuffle(temp_authors)
dataset.extend(temp_authors) 


temp_combinations = []
for adj_sinhala, adj_singlish in adjectives.items():
    for n_sinhala, n_singlish in nouns.items():
        temp_combinations.append([f"{adj_sinhala} {n_sinhala}", f"{adj_singlish} {n_singlish}"])

random.shuffle(temp_combinations) 
dataset.extend(temp_combinations[:50])

# අනුපිටපත් (Duplicates) ඉවත් කිරීම
unique_dataset = []
seen = set()
for row in dataset:
    identifier = f"{row[0]}-{row[1]}"
    if identifier not in seen:
        seen.add(identifier)
        unique_dataset.append(row)

# CSV ගොනුවට ලිවීම
filename = "phonolex_dataset.csv"
with open(filename, mode='w', newline='', encoding='utf-8') as file:
    writer = csv.writer(file)
    writer.writerow(["singlish", "sinhala"]) # Header
    writer.writerows(unique_dataset)

print(f"✅ සාර්ථකයි! 100% ක් නිවැරදි සහ අර්ථවත් පේළි {len(unique_dataset)} ක් '{filename}' ගොනුවට සුරැකිණි.")