import csv
import random

# 1.(Base Dictionary)
base_dictionary = {
    
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
    "විත්ති": "withthi", "සටහන්": "satahan", "අභිරහස්": "abhirahas", "මායම්": "maayam",
    "පළිගැනීම": "paliganima", "රහසක්": "rahasak", "සෙවණැලි": "sewanali", "බලාපොරොත්තුව": "balaporoththuwa",
    "දියණිය": "diyaniya", "දරුවා": "daruwa", "පියා": "piya", "මව": "mawa", 
    "සොහොයුරා": "sohoyura", "සොහොයුරිය": "sohoyuriya", "සොරා": "sora", 
    "ඔත්තුකරු": "otthukaru", "රහස්පරීක්ෂක": "rahaspareekshaka", "වැද්දා": "wadda",
    "ගොවියා": "gowiya", "රජතුමා": "rajathuma", "කුමර කුමරියන්": "kumara kumariyan",
    "තාපසයා": "thaapasaya", "හොරා": "hora", "ඝාතකයා": "ghathakaya",
    "කළු": "kalu", "සුදු": "sudu", "රතු": "rathu", "නිල්": "nil", "රන්": "ran", 
    "රිදී": "ridee", "මහ": "maha", "පුංචි": "punchi", "කුඩා": "kuda", 
    "අලුත්": "aluth", "පරණ": "parana", "භයානක": "bhayanaka", "සුන්දර": "sundara", 
    "අඳුරු": "anduru", "උණුසුම්": "unusum", "නිහඬ": "nihanda", "සැඟවුණු": "sangawunu",
    "අහිමි": "ahimi", "නොදුටු": "nodutu", "අවසන්": "awasan", "පළමු": "palamu",
    "දවාල": "dawala", "මධ්‍යමරෑ": "madhyamaraa", "හිරුබැසයාම": "hirubasayama",
    "අරුණලු": "arunalu", "මීදුම": "meeduma", "හිම": "hima", "ගිගුරුම්": "gigurum",
    "සඳඑළිය": "sandaeliya", "තරුකැට": "tharukata", "වැහිබිඳු": "wahibindu",
    "සිංහයා": "sinhaya", "අලියා": "aliya", "මොණරා": "monara", "හංසයා": "hansaya", 
    "කොටි": "koti", "සර්පයා": "sarpaya", "මකර": "makara", "කුරුළු": "kurulu", "වෘකයා": "wrukaya",
    "මාලය": "maalaya", "මුදුව": "muduwa", "යතුර": "yathura", "දොරටුව": "doratuwa", 
    "කඩුව": "kaduwa", "ඔරලෝසුව": "oralosuwa", "ලිපිය": "lipiya", "දිනපොත": "dinapotha", 
    "කැඩපත": "kadapatha", "මිනීපෙට්ටිය": "minipettiya", "බෝනික්කා": "bonikka", "රත්තරන්": "raththaran"
}

# 2. වැඩිදියුණු කළ වැරදි ටයිප් කිරීම් (Advanced Mutations)
mutations = [
    ("a", ""), ("w", "v"), ("v", "w"), ("th", "t"), ("t", "th"),
    ("i", "e"), ("e", "i"), ("u", "oo"), ("oo", "u"), ("y", "i"),
    ("k", "c"), ("c", "k"), ("nd", "nnd"), ("mb", "mmb"), 
    ("sh", "s"), ("s", "sh"), ("d", "dh"), ("dh", "d"),
    ("h", ""), ("aa", "a"), ("ee", "i"), ("oo", "o")
]

dataset = set()
base_words_list = list(base_dictionary.items())

# මුලින්ම හරියටම ටයිප් කරන වචන ටික (Base words) Dataset එකට දානවා
for sinhala_word, base_singlish in base_words_list:
    dataset.add((base_singlish, sinhala_word))

print("⏳ AI Dataset එක ජනනය කරමින් පවතී. කරුණාකර රැඳී සිටින්න...")

# 3. හරියටම වෙනස් දත්ත 2500ක් හැදෙනකම් Loop එක වැඩ කරනවා!
TARGET_COUNT = 5000

while len(dataset) < TARGET_COUNT:
    # අහඹු ලෙස එක වචනයක් තෝරාගන්නවා
    sinhala_word, base_singlish = random.choice(base_words_list)
    
    mutated_word = base_singlish
    num_mutations = random.randint(1, 4) # වෙනස්කම් 1ත් 4ත් අතර ප්‍රමාණයක් කරනවා
    
    for _ in range(num_mutations):
        old, new = random.choice(mutations)
        if old in mutated_word:
            # අහඹු තැනකින් එක අකුරක් විතරක් මාරු කරනවා
            mutated_word = mutated_word.replace(old, new, 1)
            
    # වචනය හිස් නැත්නම් සහ දිග නම් පමණක් එකතු කරනවා
    if len(mutated_word) > 2:
        dataset.add((mutated_word, sinhala_word))

# 4. CSV ගොනුවක් ලෙස සුරැකීම
dataset_list = list(dataset)

# අහඹු ලෙස කවලම් කිරීම (Shuffle) - ML Training වලට හොඳයි
random.shuffle(dataset_list)

with open("phonolex_dataset.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["singlish", "sinhala"]) # Header
    writer.writerows(dataset_list)

print(f"✅ සාර්ථකයි! අනුපිටපත් (Duplicates) නොමැති, වෙනස් වචන යුගල {len(dataset_list)} කින් සමන්විත Training Dataset එකක් නිර්මාණය විය.")