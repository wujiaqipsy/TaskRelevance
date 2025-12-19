    // main基于test修改指导语表述、函数调用位置，全局变量设置，时间线变量的repetitions、block的repetitions、反馈计算中的单个block总试次数


//  初始化jsPsych对象
const jsPsych = initJsPsych({
    on_finish: function () {
        jsPsych.data.get().localSave('csv', 'exp3_' + id + '.csv');
        document.exitFullscreen();
        let bodyNode = document.getElementsByTagName("body");
    }
});


// 通过网址设定被试ID
const url = new URL(window.location.href);
const id = url.searchParams.get('id');
console.log("id:", id); // 输出: "123"


// 设置时间线
var timeline = []


// 预加载实验图片
var shape_images = [   // 指导语中呈现的刺激--无颜色的形状
    '../img/circle.png',
    '../img/triangle.png'
]
var color_images = [   // 指导语中呈现的刺激--颜色刷
    '../img/red.png',
    '../img/green.png',
]
var colored_shapes = [   // 试次中呈现的刺激--有颜色的形状
    '../img/green_circle.png',
    '../img/green_triangle.png',
    '../img/red_circle.png',
    '../img/red_triangle.png',
]
var preload = {
    type: jsPsychPreload,
    images: [...shape_images, ...color_images, ...colored_shapes] // 合并数组
}
timeline.push(preload);


// ====================实验参数设置==================== //
var info = []   // 存储被试信息
var key = ['f', 'j']   // 被试按键
var view_shape_label = []   // 存储指导语中shape-label配对
var view_shape_color = []   // 存储指导语中shape-color配对   
var ShapeColorMap = new Map();   // 存储图形-颜色对
var ShapeLabelMap = new Map();   // 存储图形-标签对
var ColoredShapeLabelMap = new Map();  // 存储带颜色图形-标签对
var ColoredShapeColorMap = new Map();  // 存储带颜色图形-颜色对


const config = {
    min_sequence: 3,   // 最小序列长度 (n + 1)
    max_sequence: 5,   // 最大序列长度
    acc: 70,   // 正确率70%才能通过练习
    rep_block: 1, // 3 重复3个block
    shape_duration: 500,  // 图形呈现时间
    label_duration: 500,  // 标签呈现时间
    response_window: 2000,  // 2000ms？反应窗口时间；从标签呈现开始计算
    feedback_duration: 300,  // 反馈持续时间
    isi: 500,   // 图形间隔

    trialsPerCondition: {  // 设置为偶数,方便后期图形颜色的平衡
        prac: 2,   // 4， 练习阶段，每个条件重复4次，4个条件，练习试次16次。一个试次7s，练习阶段2mins左右
        main: 2,   // 16，正式实验，每个条件重复16次，结合3个block，每个条件有48个试次。单个block总试次数=16*4=64次，一个block 6分钟,一个任务18分钟，4个任务1h12mins
    },

    n: {
        low: 1,  // 低认知负荷
        high: 2,  // 高认知负荷
    },

    task:{
        TR: 'TaskRelevant',  // 自我与任务相关条件
        TIR: 'TaskIRRelevant',  // 自我与任务无关条件

    },

    // 标签类型列表
    label_types: ['自我', '生人'],
    color_types: ["红色", "绿色"],

};


// ====================定义函数==================== //

// 获取数组所有可能的排列组合
function permutation(arr, num) {
    var r = [];
    (function f(t, a, n) {
        if (n == 0) return r.push(t);
        for (var i = 0, l = a.length; i < l; i++) {
            // 递归调用f
            f(t.concat(a[i]), a.slice(0, i).concat(a.slice(i + 1)), n - 1);
        }
    })([], arr, num);//传入[], arr, num调用f递归函数
    return r;
}

// 定义一个函数，使注视点呈现时间为 200 到 1100 毫秒的均匀分布随机值
function getRandomTime() {
    const min = 200;
    const max = 1100;
    return Math.round(min + (max - min) * Math.random());
}


// 获取不匹配条件下呈现的标签
function getRandomNonMatchingLabel(target) {
    const availableLabels = config.label_types.filter(l => l !== target);   // 返回非目标标签
    return availableLabels[Math.floor(Math.random() * availableLabels.length)];   // 返回随机非目标标签
}


// 打乱颜色数组的辅助函数
function shuffleArray(array) {
    const newArray = [...array];  // 1. 创建原数组的副本（避免修改原数组）
    
    // 2. 从后向前遍历数组
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1)); // 3. 生成随机索引
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]]; // 4. 交换元素
    }
    
    return newArray; // 5. 返回打乱后的数组
}


// 创建TaskRelevance所有试次（核心函数）
function createTrials(n, phase, task) {  // 根据任务，n-back数，练习与正式实验创建不同的试次。
    const n_back = n;   // 认知负荷n值;
    const trials = [];  // 存储单block内所有试次

    // 存储label_types和is_match的组合，2*2=4种[自我-匹配，自我-不匹配，生人-匹配，生人-不匹配]
    const allConditions = [];

    config.label_types.forEach(labelType => {
        // 匹配试次
        allConditions.push({
            label_type: labelType,
            is_match: true,
            count: 0
        });

        // 不匹配试次
        allConditions.push({
            label_type: labelType,
            is_match: false,
            count: 0
        });
    });

        // 计算总试次数
    const trialsPerCondition = config.trialsPerCondition[phase];  // 获取练习/正式实验每个条件的重复次数，值为3/15
    const aBlockTrials = trialsPerCondition * allConditions.length;  // 计算练习/正式实验单个block总试次数，值为12/60

    // 2. 为每个条件预生成平衡的颜色池（红绿各半）
    allConditions.forEach(condition => {        
        // condition中新增colorPool属性，用于存储颜色，每种条件红绿各半，红绿顺序随机
        condition.colorPool = [
            ...Array(trialsPerCondition / 2).fill('red'),
            ...Array(trialsPerCondition / 2).fill('green')
        ];
        condition.colorPool = shuffleArray(condition.colorPool);  // 颜色池随机化
    });

    
    // 生成单个试次，循环至单个block所有试次完成
    while (trials.length < aBlockTrials) {
        const availableConditions = allConditions.filter(c => c.count < trialsPerCondition);   // 返回未满重复次数的所有条件。
        if (availableConditions.length === 0) break;

        // 1. 确定试次的实验条件：随机选择一个实验条件
        const randomIndex = Math.floor(Math.random() * availableConditions.length);
        const condition = availableConditions[randomIndex];

        // 2. 确定试次的图形序列长度：随机生成图形序列长度
        const seqLength = Math.floor(Math.random() * (config.max_sequence - config.min_sequence + 1)) + config.min_sequence;  // 取值在3-5之间，包括首尾

        // 3. 确定试次的目标位置索引
        const targetIndex = seqLength - n_back;

        // 4. 确定试次中呈现的标签、序列图片、图片对应的标签
        const shapes = [];
        const labels = [];
        const colors = [];

        // 从颜色池中取出当前试次应该使用的颜色
        const targetColor = condition.colorPool[condition.count];   // 根据当前试次index取颜色，取之前颜色已经随机过
        // console.log("现在的条件是", condition)
        // console.log("现在进行到该条件下第", condition.count,"个试次" )
        // console.log("这个试次使用的颜色是", targetColor)

        // 自我与任务有关条件
        if (task === config.task.TR) {

            for (let j = 0; j < seqLength; j++) {  // 循环生成单试次所有图形序列

                if (j === targetIndex) {
                    // 目标位置呈现的图形，matchShapes会筛选出这个标签对应的2个图形，1个红的，1个绿的
                    const matchShapes = [...ColoredShapeLabelMap.keys()].filter(
                        key => ColoredShapeLabelMap.get(key) === condition.label_type
                    );
                    // console.log("matchShapes是1红1绿2个吗", matchShapes)

                    // 根据颜色池中指定的颜色选择图形
                    seqshape = matchShapes.filter(shape => shape.includes(targetColor))[0];

                    // const filteredShapes = matchShapes.filter(shape => shape.includes(targetColor))[0];
                    // console.log("filteredShapes是一个嘛", filteredShapes)
                    // // 如果没有符合条件的图形，则使用所有匹配图形（后备方案）
                    // seqshape = filteredShapes.length > 0 
                    //     ? filteredShapes[Math.floor(Math.random() * filteredShapes.length)]
                    //     : matchShapes[Math.floor(Math.random() * matchShapes.length)];

                    // console.log("目标位置呈现的颜色图形seqshape", seqshape)  

                    // seqshape = matchShapes[Math.floor(Math.random() * matchShapes.length)];
                    shapes.push(seqshape);
                } else {
                    // 非目标位置，随机选择一个图形
                    seqshape = colored_shapes[Math.floor(Math.random() * colored_shapes.length)];
                    shapes.push(seqshape);
                }
                // 获取序列图形对应的标签
                seqlabel = ColoredShapeLabelMap.get(seqshape);
                labels.push(seqlabel);
            }
        } else if (task === config.task.TIR) {
            const baseshape = Array.from(ShapeLabelMap.keys()).filter(key => ShapeLabelMap.get(key) === condition.label_type);   //eg.自我对应的图形，三角形
            const tmpcolor = ShapeColorMap.get(baseshape[0]).includes('红色') ? 'red' : 'green';   // eg.自我图形对应的颜色；自我--三角形--红色

            for (let j = 0; j < seqLength; j++) {

                if (j === targetIndex) {
                    const matchShapes = [...ColoredShapeLabelMap.keys()].filter(
                        key => ColoredShapeLabelMap.get(key) === condition.label_type
                    );   // eg. 自我标签对应的带颜色图形，1个红色1个绿色
                    seqshape = condition.is_match ? matchShapes.find(item => item.includes(tmpcolor)) : matchShapes.find(item => !item.includes(tmpcolor));   // 匹配，返回红色三角；不匹配返回绿色三角
                    shapes.push(seqshape);
                    // if (condition.is_match) {
                    //     // 目标位置，匹配条件，随机输出一个与标签配对的带颜色图形；
                    //     const matchShapes = [...ColoredShapeColorMap.keys()].filter(
                    //         // key => ColoredShapeColorMap.get(key) === displayColor
                    //         key => key.includes(ColoredShapeColorMap.get(key))
                    //     );
                    //     seqshape = matchShapes[Math.floor(Math.random() * matchShapes.length)];
                    //     shapes.push(seqshape);
                    //     // console.log("匹配条件下的图形序列", matchShapes)
                    //     // console.log("匹配条件下的图形", seqshape)
                    // }else {
                    //     // 目标位置，不匹配条件，随机输出与标签不配对的带颜色图形；
                    //     const mismatchShapes = [...ColoredShapeColorMap.keys()].filter(
                    //         // key => ColoredShapeColorMap.get(key) !== displayColor
                    //         key => !key.includes(ColoredShapeColorMap.get(key))
                    //     );
                    //     seqshape = mismatchShapes[Math.floor(Math.random() * mismatchShapes.length)];
                    //     shapes.push(seqshape);
                    //     // console.log("不匹配条件下的图形序列", mismatchShapes)
                    //     // console.log("不匹配条件下的图形", seqshape)
                    // }
                } else {
                    // 非目标位置，随机选择一个图形
                    seqshape = colored_shapes[Math.floor(Math.random() * colored_shapes.length)];
                    shapes.push(seqshape);
                }
                // 获取序列图形对应的标签
                seqcolor = ColoredShapeColorMap.get(seqshape);
                colors.push(seqcolor);  // 获取图形对应的标签
            }



        }

        // 根据匹配情况呈现标签
        let displayLabel;
        if (condition.is_match) {
            displayLabel = condition.label_type; // 匹配试次：显示图形对应的真实标签
        } else {
            displayLabel = getRandomNonMatchingLabel(condition.label_type); // 不匹配试次：显示其他标签

        }

        // 目标位置的图形,对应标签/颜色
        const nBackShape = shapes[targetIndex];
        const nBackLabel = labels[targetIndex];
        const nBackColor = colors[targetIndex];


        // 生成单试次数据
        trials.push({
            phase: phase,
            n_back: n_back,
            task: task,
            is_match: condition.is_match,
            shape_meaning: condition.label_type,
            condition_type: condition,
            sequence: shapes,   // 图形序列
            display_label: displayLabel,
            nBack_shape: nBackShape,
            nBack_label: nBackLabel,
            nBack_color: nBackColor,
            correct_response: condition.is_match ? key[0] : key[1],
        });

        // 更新该条件的计数
        condition.count++;

    }

    console.log("单个block的总试次数是:", aBlockTrials);
    console.log("当前的trials序列是:", trials);
    


    return { trials, aBlockTrials };   // 返回试次和单个block的总试次数 
}


// 创建单个试次的时间线：注视点、图片序列、文字标签、反应窗口、反馈
function createTrialTimeline(trials) {
    const timeline = [];

    // 遍历每个试次
    trials.forEach(trial => {

        // 1. 注视点
        timeline.push({
            type: jsPsychHtmlKeyboardResponse,
            stimulus: '<div style="font-size: 60px;">+</div>',
            choices: "NO_KEYS",
            // trial_duration: config.fixation_duration
            trial_duration: function() {
                        const fixationDuration = getRandomTime(); // 从200-1100的均匀分布中随机获取注视点呈现时长
                        console.log('注视点时长：', fixationDuration);
                        return fixationDuration;
                    }
        });

        // 2. 呈现图形序列
        trial.sequence.forEach(shape => {
            timeline.push({
                type: jsPsychImageKeyboardResponse,
                stimulus: shape,
                choices: "NO_KEYS",
                trial_duration: config.shape_duration,
                post_trial_gap: config.isi,
                data: {
                    phase: trial.phase,
                    stage: 'shape',
                    shape: shape
                }
            });
        });

        // 3. 呈现文字标签并收集反应
        timeline.push({
            type: jsPsychHtmlKeyboardResponse,
            // stimulus: `<div style="font-size: 60px;">${trial.display_label}</div>`,
            stimulus: function () {
                if (trial.task === config.task.TR) {
                    return `<div style="font-size: 60px;">${trial.display_label}</div>`;
                } else if (trial.task === config.task.TIR) {
                    return '';
                    // return `<div style="font-size: 60px;">${trial.display_color}</div>`;
                }
            },
            choices: ['f', 'j'],
            stimulus_duration: config.label_duration,
            trial_duration: config.response_window,   // 标签呈现就可以按键反应
            response_ends_trial: true,
            data: {
                subj_idx: id,
                phase: trial.phase,
                stage: 'response',
                TaskRelevance: trial.task,
                CognitiveLoad: trial.n_back,   // 认知负荷n值
                isMatch: trial.is_match,   // 是否匹配
                Identity: trial.shape_meaning,
                display_label: trial.display_label,
                nBack_shape: trial.nBack_shape,
                nBack_color: trial.nBack_color,
                nBack_label: trial.nBack_label,
                sequence: trial.sequence.join(','),
                condition_type: trial.condition_type,
                correct_response: trial.correct_response
            },
            on_start: function () {
                // console.log('当前试次图形身份是', trial.shape_meaning,)
                console.log('当前试次匹配情况是', trial.is_match)
                console.log('目标位置图形是', trial.nBack_shape);
                console.log('正确反应是', trial.correct_response)
            },
            on_finish: function (data) {
                data.correct_response = trial.correct_response;
                data.correct = data.correct_response == data.response;   // 按键正确与否
            }
        });
        // 4. 单个试次反馈
        timeline.push({
            type: jsPsychHtmlKeyboardResponse,
            stimulus: function () {
                const lastTrial = jsPsych.data.get().last(1).values()[0];
                const keypress = lastTrial.response;
                const time = lastTrial.rt;
                const trial_correct_response = lastTrial.correct_response;
                if (time > 1500 || time === null) { //大于1500或为null为过慢
                    return "<span class='add_' style='color:yellow; font-size: 70px;'> 太慢! </span>"
                } else if (time < 200) { //小于两百为过快反应
                    return "<span style='color:yellow; font-size: 70px;'>过快! </span>"
                } else {
                    if (keypress == trial_correct_response) { //如果按键 == 正确按键
                        return "<span style='color:GreenYellow; font-size: 70px;'>正确! </span>"
                    }
                    else {
                        return "<span style='color:red; font-size: 70px;'>错误! </span>"
                    }
                }
            },
            choices: "NO_KEYS",
            trial_duration: config.feedback_duration,
            data: {
                stage: 'feedback'
            }
        });
    });

    return timeline;
}


// ====================调用函数：调用顺序很重要，createTRTrials中ShapeLabelMap以及key需要先根据被试ID随机==================== //

// 1. 按被试ID随机配对图形-标签/图形-颜色；建立ShapeLabelMap, ShapeColorMap
shape_images = permutation(shape_images, 2)[parseInt(id) % 2]

// 二次随机img，S-L上下位置不一样   
jsPsych.randomization.shuffle(shape_images).forEach((v, i) => {
    view_shape_label.push(`<img src="${v}" width=140 style="vertical-align:middle"><span style=" font-size: 35px;">&nbsp-----&nbsp${config.label_types[shape_images.indexOf(v)]}</span>`);   // texts不需要随机,shape_images存储的是第一次根据ID随机抽取的结果；使用shape_images.indexOf(v)能够返回二次随机图形在一次随机中的索引值，这是个固定值，然后再根据此索引调出labels对应的值；view_texts_images存储的是v,v的值不变，所以图形-标签值不变，但v的顺序被shuffle，所以出现的图形-标签出现的顺序会变。
    ShapeLabelMap.set(v, `${config.label_types[shape_images.indexOf(v)]}`);// 存储图形-标签键值对，用于timelinevariable
    view_shape_color.push(`<img src="${v}" width=140 style="vertical-align:middle"><span style=" font-size: 35px;">&nbsp-----&nbsp${config.color_types[shape_images.indexOf(v)]}</span>`);
    ShapeColorMap.set(v, `${config.color_types[shape_images.indexOf(v)]}`);// 存储图形-颜色键值对，用于timelinevariable
});

// 2. 建立带颜色图形与标签/颜色的映射
colored_shapes.forEach(coloredShape => {
  const baseShape = coloredShape.replace(/[^/]+$/, filename => {    // 提取基础形状名称（去掉颜色前缀）
    return filename.replace(/^[\w-]+_/, ''); 
  });  
    const chineseColor = ShapeColorMap.get(baseShape);
    const englishColor = chineseColor.includes('红色') ? 'red' : 'green';

  ColoredShapeLabelMap.set(coloredShape, ShapeLabelMap.get(baseShape));  // 建立带颜色图形与标签的映射
  ColoredShapeColorMap.set(coloredShape, englishColor);  // 建立带颜色图形与颜色的映射

});


// 3. 按被试ID随机按键
key = permutation(key, 2)[parseInt(id) % 2];// 根据ID随机按键

console.log('随ID随机的按键', key);
console.log('图形-标签配对', ShapeLabelMap);
console.log('图形-颜色配对', ShapeColorMap);


// 4. 生成试次

// 练习阶段试次
TR_high_prac_result = createTrials(n=config.n.high, phase='prac', task=config.task.TR);  // 自我与任务有关，高认知负荷
TR_low_prac_result = createTrials(n=config.n.low, phase='prac', task=config.task.TR);  // 自我与任务有关，低认知负荷
TIR_high_prac_result = createTrials(n=config.n.high, phase='prac', task=config.task.TIR);  // 自我与任务无关，高认知负荷
TIR_low_prac_result = createTrials(n=config.n.low, phase='prac', task=config.task.TIR);  // 自我与任务无关，低认知负荷

// 正式实验阶段试次
TR_high_main_result = createTrials(n=config.n.high, phase='main', task=config.task.TR);  // 自我与任务有关，高认知负荷
TR_low_main_result = createTrials(n=config.n.low, phase='main', task=config.task.TR);  // 自我与任务有关，低认知负荷
TIR_high_main_result = createTrials(n=config.n.high, phase='main', task=config.task.TIR);  // 自我与任务无关，高认知负荷
TIR_low_main_result = createTrials(n=config.n.low, phase='main', task=config.task.TIR);  // 自我与任务无关，低认知负荷

console.log('任务有关高负荷_练习试次', TR_high_prac_result);




// ====================信息采集阶段==================== //
// 欢迎语
var welcome = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
        <p>您好，欢迎参加本实验。</p>
        <p>本实验由4个按键任务组成, 预计用时50分钟</p>
        <p>请您根据指导语完成任务。</p>
        <p><div style = "color: green"><按任意键至下页></div> </p>
    `,
    choices: "ALL_KEYS",
};
timeline.push(welcome);


// 基本信息指导语
var basic_information = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
     <div style="text-align: center;">
          <p>首先需要您填写基本个人信息。</p>
          <div style = "color: green"><按任意键至下页></div>
     </div>
     `,
    choices: "ALL_KEYS",
};
// timeline.push(basic_information);


// 基本信息收集
var information = {
    timeline: [
        {//探测被试显示器数据
            type: jsPsychCallFunction,
            func: function () {
                if ($(window).outerHeight() < 500) {
                    alert("您设备不支持实验，请退出全屏模式。若已进入全屏，请换一台高分辨率的设备，谢谢。");
                    window.location = "";
                }
            }
        },
        {//收集性别
            type: jsPsychHtmlButtonResponse,
            stimulus: "<p style = 'color : white'>您的性别</p>",
            choices: ['男', '女', '其他'],
            on_finish: function (data) {
                info["Sex"] = data.response == 0 ? "Male" : (data.response == 1 ? "Female" : "Other")   // 若反应为0则转为Male,反应为1转为female,其他值转为other
            }
        },
        {//收集出生年
            type: jsPsychSurveyHtmlForm,
            preamble: "<p style = 'color : white'>您的出生年</p>",
            html: function () {
                let data = localStorage.getItem(info["subj_idx"]) ? JSON.parse(localStorage.getItem(info["subj_idx"]))["BirthYear"] : "";// 提示用户输入1900~2023数值，若输入超过4位数则截取前四位
                return `<p>
        <input name="Q0" type="number" value=${data} placeholder="1900~2023" min=1900 max=2023 oninput="if(value.length>4) value=value.slice(0,4)" required />
        </p>`
            },
            button_label: '继续',
            on_finish: function (data) {
                info["BirthYear"] = data.response.Q0;
            }
        },
        {//收集教育经历
            type: jsPsychSurveyHtmlForm,
            preamble: "<p style = 'color : white'>您的教育经历是</p>",
            html: function () {
                return `
                <p><select name="Q0" size=10>
                <option value=1>小学以下</option>
                <option value=2>小学</option>
                <option value=3>初中</option>
                <option value=4>高中</option>
                <option value=5>大学</option>
                <option value=6>硕士</option>
                <option value=7>博士</option>
                <option value=8>其他</option>
                </select></p>`
            },
            on_load: function () {
                $("option[value=" + (["below primary school", "primary school", "junior middle school", "high school", "university", "master", "doctor", "other"].indexOf(localStorage.getItem(info["subj_idx"]) ? JSON.parse(localStorage.getItem(info["subj_idx"]))["Education"] : "") + 1) + "]").attr("selected", true);
            },
            button_label: '继续',
            on_finish: function (data) {
                let edu = ["below primary school", "primary school", "junior middle school", "high school", "university", "master", "doctor", "other"];

                info["Education"] = edu[parseInt(data.response.Q0) - 1];
            }
        }
    ]
};
// timeline.push(information);


// ====================设备调整阶段==================== //

// 测试被试和显示器之间的距离
var chinrest = {
    type: jsPsychVirtualChinrest,
    blindspot_reps: 3,
    resize_units: "deg",
    pixels_per_unit: 50,
    item_path: '../img/card.png',
    adjustment_prompt: function () {
        // let 类似于var 声明对象为变量，常用let而不是var
        let html = `<p style = "font-size: 28px">首先，我们将快速测量您的显示器上像素到厘米的转换比率。</p>`;
        html += `<p style = "font-size: 28px">请您将拿出一张真实的银行卡放在屏幕上方，单击并拖动图像的右下角，直到它与屏幕上的信用卡大小相同。</p>`;
        html += `<p style = "font-size: 28px">您可以使用与银行卡大小相同的任何卡，如会员卡或驾照，如果您无法使用真实的卡，可以使用直尺测量图像宽度至85.6毫米。</p>`;
        html += `<p style = "font-size: 28px"> 如果对以上操作感到困惑，请参考这个视频： <a href='https://www.naodao.com/public/stim_calibrate.mp4' target='_blank' style='font-size:24px'>参考视频</a></p>`;
        return html
    },
    blindspot_prompt: function () {
        // <br>为换行标签，<a href >为超链接标签
        return `
         <p style="text-align: left; font-size: 28px;">
         现在，我们将快速测量您和屏幕之间的距离：<br>
         请把您的左手放在 空格键上<br>
         请用右手遮住右眼<br>
         请用您的左眼专注于黑色方块。将注意力集中在黑色方块上。<br>
         如果您已经准备好了就按下 空格键 ，这时红色的球将从右向左移动，并将消失。当球一消失，就请再按空格键<br>
         如果对以上操作感到困惑，请参考这个视频：
         <a href='https://www.naodao.com/public/stim_calibrate.mp4' target='_blank' style='font-size:24px'>参考视频</a><br>
         <a style="text-align:center">准备开始时，请按空格键。</a>
         </p>
         `
    },
    blindspot_measurements_prompt: `剩余测量次数：`,
    on_finish: function (data) {
        console.log(data)
    },
    redo_measurement_button_label: `还不够接近，请重试`,
    blindspot_done_prompt: `是的`,
    adjustment_button_prompt: `图像大小对准后，请单击此处`,
    viewing_distance_report: `<p>根据您的反应，您距离屏幕<span id='distance-estimate' style='font-weight: bold;'></span> <br>这大概是对的吗？</p> `,
};
// timeline.push(chinrest)


// 进入全屏
var fullscreen_trial = {
    type: jsPsychFullscreen,
    fullscreen_mode: true,
    message: "<p><span class='add_' style='color:white; font-size: 35px;'> 实验需要全屏模式，实验期间请勿退出全屏。 </span></p >",
    button_label: " <span class='add_' style='color:black; font-size: 20px;'> 点击这里进入全屏</span>"
}
// timeline.push(fullscreen_trial);



// ====================练习阶段函数==================== //

// 指导语:根据任务类型和n-back变化
function task_instr(condition_result) {
    return {
        type: jsPsychInstructions,
        pages: function () {
            let start = "<p>请您记住下列对应关系:</p>",
                middle = "<p>如果对本实验还有不清楚之处，请立即向实验员咨询。</p>",
                end = "<p>如果您记住了对应关系及按键规则，请点击 继续</p>";
            let tmpI = "";
            let nBack;
            if (condition_result.trials[0].n_back > 1) { 
                nBack = config.n.high
            } else if (condition_result.trials[0].n_back <= 1) {
                nBack = config.n.low
            };
            // 图形-标签匹配任务指导语
            if (condition_result.trials[0].task === 'TaskRelevant') {
                view_shape_label.forEach(v => {   // 呈现图形标签对应关系
                    tmpI += `<p class="content" style='font-size:35px'>${v}</p>`;
                });
                return [
                    start + `<div class="box">${tmpI}</div>`,
                    `<p>当前任务中，屏幕中央将呈现图形序列与文字标签，</p>
                 <p><span style="color: lightgreen;">您需要在标签出现时,判断标签前${nBack}个图形是否与当前标签匹配, </span></p>
                 <p>如果二者<span style="color: lightgreen;">匹配</span>，请按 <span style="color: lightgreen">${key[0]}键</span>，如果<span style="color: lightgreen;">不匹配</span>，请按<span style="color: lightgreen"> ${key[1]}键。</p>
                 <p style ='font-size: 20px';>在实验过程中请将您<span style="color: lightgreen; ">左手与右手的食指</span>分别放在电脑键盘的相应键位上准备按键。</p></span>`,
                    `<p>接下来，您将进入练习部分，<span style="color: lightgreen;">请您又快又准地进行按键。</span></p>
                 <p>通过练习后，您将进入正式实验。</p></span>`,
                    middle + end];

            // 图形-颜色匹配任务指导语
            } else if (condition_result.trials[0].task === 'TaskIRRelevant') {
                view_shape_color.forEach(v => {   // 呈现图形颜色对应关系
                    tmpI += `<p class="content" style='font-size:35px'>${v}</p>`;
                })
                return [
                    start + `<div class="box">${tmpI}</div>`,
                    `<p>当前任务中，屏幕中央将呈现图形序列，</p>
                 <p><span style="color: lightgreen;">您需要在出现空屏时,判断空屏前${nBack}个图形的颜色与形状是否匹配, </span></p>
                 <p>如果二者<span style="color: lightgreen;">匹配</span>，请按 <span style="color: lightgreen">${key[0]}键</span>，如果<span style="color: lightgreen;">不匹配</span>，请按<span style="color: lightgreen"> ${key[1]}键。</p>
                 <p style ='font-size: 20px';>在实验过程中请将您<span style="color: lightgreen; ">左手与右手的食指</span>分别放在电脑键盘的相应键位上准备按键。</p></span>`,
                    `<p>接下来，您将进入练习部分，<span style="color: lightgreen;">请您又快又准地进行按键。</span></p>
                 <p>通过练习后，您将进入正式实验。</p></span>`,
                    middle + end];
            }

        },
        show_clickable_nav: true,
        button_label_previous: " <span class='add_' style='color:black; font-size: 20px;'> 返回</span>",
        button_label_next: " <span class='add_' style='color:black; font-size: 20px; '> 继续</span>",
        on_load: () => {
            $("body").css("cursor", "default");
        },// 开始时鼠标出现
        on_finish: function () {
            $("body").css("cursor", "none");
        } //结束时鼠标消失
    }
}


// 创建单个block时间线
function Block(condition_result) {
    return{
        timeline: createTrialTimeline(condition_result.trials),   
        on_load: () => {
            $("body").css("cursor", "none");
        },
        on_finish: function () {
            $("body").css("cursor", "default");
        }
    }
}


// 生成练习阶段单个block反馈
function pracBlockFeedback(condition_result) {
    return{
        type: jsPsychHtmlKeyboardResponse,
    stimulus: function () {
        let trials = jsPsych.data.get().filter(
            [{ correct: true }, { correct: false }]
        ).last(condition_result.aBlockTrials); //一个block内所有试次总数
        let correct_trials = trials.filter({
            correct: true   // 获取正确的试次
        });
        let accuracy = Math.round(correct_trials.count() / trials.count() * 100);   //计算正确率
        console.log('练习次数', trials.count())
        let rt = Math.round(correct_trials.select('rt').mean());   // 计算平均反应时
        return `
    <style>
        .context { color: white; font-size: 35px; line-height: 40px; }
    </style>
    <div>
        <p class='context'>您正确回答了 ${accuracy}% 的试次。</p>
        <p class='context'>您的平均反应时为 ${rt} 毫秒。</p>
        <p class='context'>按任意键进入下一页</p>
    </div>
`;
    }
    }
}


// 被试重新回忆联结关系
function recapInstr(condition_result) {
    return {
        type: jsPsychInstructions,
        pages: function () {
            let start = "<p>请您努力记住下列对应关系，并再次进行练习。</p>",
                middle = "<p>如果对本实验还有不清楚之处，请立即向实验员咨询。</p>",
                end = "<p>如果您明白了规则：请按 继续 进入练习</p>";
            let tmpI = "";
            let nBack;
            if (condition_result.trials[0].n_back > 1) {
                nBack = config.n.high
            } else if (condition_result.trials[0].n_back <= 1) {
                nBack = config.n.low
            };
            if (condition_result.trials[0].task === 'TaskRelevant') {
                view_shape_label.forEach(v => {   // 呈现图形标签对应关系
                    tmpI += `<p class="content" style='font-size:35px'>${v}</p>`;
                });
                return [
                    "<p>您的正确率未达到进入正式实验的要求。</p>",
                    start + `<div class="box">${tmpI}</div>`,
                    `<p>当前任务中，屏幕中央将呈现图形序列与文字标签，</p>
                 <p><span style="color: lightgreen;">您需要在标签出现时,判断标签前${nBack}个图形是否与当前标签匹配，</span></p>
                 <p>如果二者<span style="color: lightgreen;">匹配</span>，请按 <span style="color: lightgreen">${key[0]}键</span>，如果<span style="color: lightgreen;">不匹配</span>，请按<span style="color: lightgreen"> ${key[1]}键。</p>
                 <p><span style="color: lightgreen;">请您又快又准地进行按键。</span></p>`,
                    middle + end];

            } else if (condition_result.trials[0].task === 'TaskIRRelevant') {
                view_shape_color.forEach(v => {   // 呈现图形标签对应关系
                    tmpI += `<p class="content" style='font-size:35px'>${v}</p>`;
                });
                return [
                    "<p>您的正确率未达到进入正式实验的要求。</p>",
                    start + `<div class="box">${tmpI}</div>`,
                    `<p>当前任务中，屏幕中央将呈现图形序列，</p>
                 <p><span style="color: lightgreen;">您需要在出现空屏时,判断空屏前${nBack}个图形的颜色与形状是否匹配, </span></p>
                 <p>如果二者<span style="color: lightgreen;">匹配</span>，请按 <span style="color: lightgreen">${key[0]}键</span>，如果<span style="color: lightgreen;">不匹配</span>，请按<span style="color: lightgreen"> ${key[1]}键。</p>
                 <p><span style="color: lightgreen;">请您又快又准地进行按键。</span></p>`,
                    middle + end];
            }

            console.log("当前任务是", condition_result, "当前呈现配对关系是", tmpI, "当前nback数是", nBack)

        },
        show_clickable_nav: true,
        button_label_previous: " <span class='add_' style='color:black; font-size: 20px;'> 返回</span>",
        button_label_next: " <span class='add_' style='color:black; font-size: 20px;'> 继续</span>",
        on_finish: function () {
            $("body").css("cursor", "none");
        },
        on_load: () => {
            $("body").css("cursor", "default");
        }
        }
    }


// 判断是否重新练习
function reprac_if_node(condition_result){
    return{
        timeline: [
            recapInstr(condition_result)
        ],
    conditional_function: function (data) {
        var trials = jsPsych.data.get().filter(
            [{ correct: true }, { correct: false }]
        ).last(condition_result.aBlockTrials);   
        var correct_trials = trials.filter({
            correct: true
        });
        var accuracy = Math.round(correct_trials.count() / trials.count() * 100);
        if (accuracy >= config.acc) {   // 比较练习阶段ACC与70%的大小
            return false;   //达标则跳过timeline,进入正式实验
        } else if (accuracy < config.acc) { //没达标则进行timeline
            return true;
        }
    }
    }
}


// 再次练习循环
function reprac_loop_node(condition_result){
    return{
        timeline: [
            Block(condition_result),
            pracBlockFeedback(condition_result), // 单个block反馈
            reprac_if_node(condition_result)
        ],
        loop_function: function () {
            var trials = jsPsych.data.get().filter(
                [{ correct: true }, { correct: false }]
            ).last(condition_result.aBlockTrials);   //需要修改
            var correct_trials = trials.filter({
                correct: true
            });
            var accuracy = Math.round(correct_trials.count() / trials.count() * 100);
            if (accuracy >= config.acc) {
                return false;   // 正确率达标，不循环，执行一次timeline
            } else if (accuracy < config.acc) {    // 不达标，repeat，再执行一次timeline
                return true;
            }
        }
    }

}


// 完整的练习设置：练习+判断是否再次练习
function createPracticeBlock(condition_result) {
    // console.log(condition_result, '练习阶段开始啦')
    return [
        reprac_loop_node(condition_result), // 循环练习阶段
    ];
}


// ====================正式实验阶段函数==================== //

// 进入正式实验指导语
var Congrats = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
        <style>
            .context { color: white; font-size: 35px; line-height: 40px; }
            .highlight { color: lightgreen; font-size: 35px; }
            .footer { font-size: 22px; line-height: 40px; }
        </style>
        <div>
            <p class="context">恭喜您完成练习。按任意键进入正式实验。</p>
            <p class="highlight">正式实验与练习要求相同，请您尽可能又快又准地进行按键反应</p>
            <p class="footer">请将您左手和右手的食指放在电脑键盘的相应键位上进行按键。</p>
        </div>
    `,
    choices: 'ALL_KEYS',
    on_finish: function() {
        $("body").css("cursor", "none");
    }
};


// 正式实验单个block反馈
function mainBlockFeedback(condition_result) {
    return {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: function () {
            let trials = jsPsych.data.get().filter(
                [{ correct: true }, { correct: false }]
            ).last(condition_result.aBlockTrials);// 填入一个block里的trial总数;
            console.log('main block 总数', condition_result.aBlockTrials);
            let correct_trials = trials.filter({
                correct: true
            });
            let accuracy = Math.round(correct_trials.count() / trials.count() * 100);
            let rt = Math.round(correct_trials.select('rt').mean());
            return "<style>.context{color:white; font-size: 35px; line-height:40px}</style>\
                          <div><p class='context'>您正确回答了" + accuracy + "% 的试次。</p>" +
                "<p class='context'>您的平均反应时为" + rt + "毫秒。</p>" +
                "<p class='context'>请按任意键进入休息</p></div>";
        },
        on_finish: function () {
            $("body").css("cursor", "default"); //鼠标出现
        }
    }
};


// 休息指导语
function rest(resid_block_numb) {
    return {
        type: jsPsychHtmlButtonResponse,
        stimulus: function () {
            let totaltrials = jsPsych.data.get().filter(
                [{ correct: true }, { correct: false }]
            );
            return `
                    <p>当前任务中，您还剩余${resid_block_numb}组实验</p>
                    <p>现在是休息时间，当您结束休息后，您可以点击 结束休息 按钮 继续</p>
                    <p>建议休息时间还剩余<span id="iii">60</span>秒</p>`
        },
        choices: ["结束休息"],
        on_load: function () {
            $("body").css("cursor", "default");
            let tmpTime = setInterval(function () {
                $("#iii").text(parseInt($("#iii").text()) - 1);
                if (parseInt($("#iii").text()) < 1) {
                    $("#iii").parent().text("当前限定休息时间已到达，如果还未到达状态，请继续休息");
                    clearInterval(parseInt(sessionStorage.getItem("tmpInter")));
                }
            }, 1000);
            sessionStorage.setItem("tmpInter", tmpTime);
        },
        on_finish: function () {
            // $("body").css("cursor", "none"); //鼠标消失
            resid_block_numb -= 1;
            $(document.body).unbind();
            clearInterval(parseInt(sessionStorage.getItem("tmpInter")));

        }
    }
}

// 进入下一个任务指导语
function TaskTransitionMessage(taskNumber) {
    return {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: function () {
            if (taskNumber <= 3) {
                return `
            <div style="text-align: center; color: white; font-size: 35px; line-height: 40px;">
                <p>恭喜您完成任务${taskNumber}, 接下来您将进入任务${taskNumber + 1}。</p>
                <p style="color: lightgreen; margin-top: 30px;">按任意键继续</p>
            </div>
        `;
            } else{
                return `
            <div style="text-align: center; color: white; font-size: 35px; line-height: 40px;">
                <p>恭喜您完成任务${taskNumber}!</p>
                <p style="color: lightgreen; margin-top: 30px;">按任意键继续</p>
            </div>
        `;
            }
        },
        choices: "ALL_KEYS",
    };
}
    


// 完整的正式实验设置
function createMainBlock(condition_result) {
    let resid_block_numb = config.rep_block - 1
    
    // console.log(condition_result, '正式实验开始啦')
    
    return [
        {
            timeline: [
                Block(condition_result),
                mainBlockFeedback(condition_result),
                rest(resid_block_numb),

            ],
            repetitions: config.rep_block
        }

    ];
}


// 完整的单个任务设置：练习+正式实验
function createTaskTrials(prac_result, main_result, taskNumber) {
    // console.log('现在是第',taskNumber,"个任务")
    return [
        {
            timeline: [
                task_instr(prac_result),
                ...createPracticeBlock(prac_result),
                Congrats,
                ...createMainBlock(main_result),
                TaskTransitionMessage(taskNumber)
            ],
        }

    ];
}


// 设置任务执行顺序根据被试ID随机

// 1.定义四个基本任务
const task_TR_high = { name: 'TR_high', prac: TR_high_prac_result, main: TR_high_main_result };
const task_TR_low = { name: 'TR_low', prac: TR_low_prac_result, main: TR_low_main_result };
const task_TIR_high = { name: 'TIR_high', prac: TIR_high_prac_result, main: TIR_high_main_result };
const task_TIR_low = { name: 'TIR_low', prac: TIR_low_prac_result, main: TIR_low_main_result };

// 2. 任务顺序根据id随机
const orderId = id % 4;

// 3. 设置任务顺序：先进行TR建立自我图形，再进行TIR
const taskSequence = [
    // TR组的顺序
    orderId & 1 ? task_TR_low : task_TR_high,
    orderId & 1 ? task_TR_high : task_TR_low,
    
    // TIR组的顺序
    orderId >> 1 & 1 ? task_TIR_low : task_TIR_high,
    orderId >> 1 & 1 ? task_TIR_high : task_TIR_low
]

// console.log("被试的顺序ID是", orderId)
console.log("被试抽中的顺序是", taskSequence)

// 4. 按照既定顺序执行4个任务timeline
taskSequence.forEach((task, index) => {
    let taskNumber = index +1
    timeline.push(...createTaskTrials(task.prac, task.main, taskNumber));
});


// 实验结束语
var finish = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
        <p>感谢您参加我们的实验，请<span style="color: yellow;">按任意键开始下载数据</span>，并通知实验员。</p>
        <p>感谢您的配合！</p>`,
    choices: "ALL_KEYS",
};
timeline.push(finish);


// 运行整个实验
jsPsych.run(timeline);

