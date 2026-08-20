/**
 * Isometric Separation Lab Store (Reactive State Management)
 * Single Responsibility: Manages state for active mixture, shelf items, simulation status & annotations.
 */

export const MIXTURES = {
    sand_water: {
        id: 'sand_water',
        name: 'الرمل والماء',
        type: 'غير متجانس',
        badge: 'heterogeneous',
        propertyKey: 'grain_size',
        propertyName: 'حجم الحبيبات / الذوبانية',
        propertyDesc: 'الرمل غير ذائب وحبيباته أكبر من مسام ورق الترشيح.',
        correctTool: 'filter',
        recommendedToolName: 'قمع وورقة ترشيح'
    },
    salt_water: {
        id: 'salt_water',
        name: 'الملح والماء',
        type: 'متجانس (محلول)',
        badge: 'homogeneous',
        propertyKey: 'boiling_point',
        propertyName: 'درجة الغليان',
        propertyDesc: 'الماء يغلي ويتبخر عند 100°م بينما الملح درجة انصرافه وغليانه مرتفعة جداً فيبقى.',
        correctTool: 'burner',
        recommendedToolName: 'موقد لهب / طبق تبخير'
    },
    oil_water: {
        id: 'oil_water',
        name: 'الزيت والماء',
        type: 'غير متجانس',
        badge: 'heterogeneous',
        propertyKey: 'density',
        propertyName: 'الكثافة',
        propertyDesc: 'كثافة الزيت (0.92 جم/سم³) أقل من كثافة الماء (1 جم/سم³) فيطفو الزيت بالأعلى.',
        correctTool: 'funnel',
        recommendedToolName: 'قمع الفصل'
    },
    iron_sand: {
        id: 'iron_sand',
        name: 'برادة الحديد والرمل',
        type: 'غير متجانس',
        badge: 'heterogeneous',
        propertyKey: 'magnetism',
        propertyName: 'المغناطيسية',
        propertyDesc: 'الحديد مادة مغناطيسية تنجذب للمغناطيس، بينما الرمل مادة غير مغناطيسية.',
        correctTool: 'magnet',
        recommendedToolName: 'مغناطيس'
    },
    sand_gravel: {
        id: 'sand_gravel',
        name: 'الرمل والحصى',
        type: 'غير متجانس',
        badge: 'heterogeneous',
        propertyKey: 'particle_size',
        propertyName: 'حجم الحبيبات',
        propertyDesc: 'حبيبات الرمل صغيرة تعبر ثقوب الغربال، والحصى كبير الحجم يبقى بالأعلى.',
        correctTool: 'sieve',
        recommendedToolName: 'غربال (منخل)'
    }
};

export const TOOLS = [
    { id: 'filter', name: 'قمع ورقة الترشيح', icon: 'fa-filter', property: 'الترشيح' },
    { id: 'funnel', name: 'قمع الفصل', icon: 'fa-vial', property: 'الكثافة' },
    { id: 'burner', name: 'موقد التبخير', icon: 'fa-fire', property: 'درجة الغليان' },
    { id: 'magnet', name: 'مغناطيس', icon: 'fa-magnet', property: 'المغناطيسية' },
    { id: 'sieve', name: 'غربال الحبيبات', icon: 'fa-border-all', property: 'حجم الحبيبات' }
];

class LabStore {
    constructor() {
        this.listeners = new Set();
        this.state = {
            activeMixtureId: 'sand_water',
            isPlaying: true,
            speed: 1,
            showLabels: true,
            activeTool: null,
            simulationPhase: 'idle', // 'idle' | 'pouring' | 'separating' | 'separated' | 'failed'
            pourSequence: [], // e.g. ['oil', 'water']
            toast: {
                visible: true,
                message: 'اسحب إحدى الأدوات من الرف أو انقر عليها لتطبيق طريقة الفصل!',
                type: 'info'
            }
        };
    }

    getState() {
        return this.state;
    }

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    setState(partialState) {
        this.state = { ...this.state, ...partialState };
        this.listeners.forEach(fn => fn(this.state));
    }

    setMixture(mixtureId) {
        if (!MIXTURES[mixtureId]) return;
        this.setState({
            activeMixtureId: mixtureId,
            simulationPhase: 'idle',
            activeTool: null,
            pourSequence: [],
            toast: {
                visible: true,
                message: `تم اختيار مخلوط: ${MIXTURES[mixtureId].name}. ما هي الخاصية الفيزيائية المناسبة لفصله؟`,
                type: 'info'
            }
        });
    }

    toggleLabels() {
        this.setState({ showLabels: !this.state.showLabels });
    }

    setSpeed(speed) {
        this.setState({ speed });
    }

    togglePlay() {
        this.setState({ isPlaying: !this.state.isPlaying });
    }

    reset() {
        const mix = MIXTURES[this.state.activeMixtureId];
        this.setState({
            simulationPhase: 'idle',
            activeTool: null,
            pourSequence: [],
            toast: {
                visible: true,
                message: `تم إعادة ضبط الكأس لمخلوط (${mix.name}).`,
                type: 'info'
            }
        });
    }

    showToast(message, type = 'info') {
        this.setState({
            toast: { visible: true, message, type }
        });
    }
}

export const labStore = new LabStore();
