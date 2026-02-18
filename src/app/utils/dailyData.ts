export const dailyAyahs = [
    {
        content: "وَقَالَ رَبُّكُمُ ادْعُونِي أَسْتَجِبْ لَكُمْ",
        reference: "سورة غافر: ٦٠",
        theme: "indigo"
    },
    {
        content: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
        reference: "سورة الشرح: ٦",
        theme: "emerald"
    },
    {
        content: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ",
        reference: "سورة الطلاق: ٣",
        theme: "amber"
    },
    {
        content: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
        reference: "سورة الرعد: ٢٨",
        theme: "rose"
    }
];

export const dailyHadiths = [
    {
        content: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى",
        reference: "متفق عليه",
        theme: "purple"
    },
    {
        content: "أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ",
        reference: "صحيح البخاري",
        theme: "blue"
    },
    {
        content: "خيركم من تعلم القرآن وعلمه",
        reference: "صحيح البخاري",
        theme: "green"
    }
];

export const getDailyItem = (list: any[]) => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    return list[dayOfYear % list.length];
};
