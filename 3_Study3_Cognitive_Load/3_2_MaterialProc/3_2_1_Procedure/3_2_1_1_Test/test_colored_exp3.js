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
var colors = ['red', 'green'];   // 颜色列表，可能用不到


const config = {
    min_sequence: 3,   // 最小序列长度 (n + 1)
    max_sequence: 5,   // 最大序列长度
    acc: 70,   // 正确率70%才能通过练习
    rep_block: 4,
    // fixation_duration: 500,
    shape_duration: 500,  // 图形呈现时间
    label_duration: 500,  // 标签呈现时间
    response_window: 2000,  // 反应窗口时间
    feedback_duration: 300,  // 反馈持续时间
    isi: 500,   // 图形间隔

    trialsPerCondition: {
        prac: 1,   // 3， 练习阶段，每个条件重复3次，共有2*2=4个条件，练习试次12次
        main: 2,   // 15，正式实验，每个条件重复15次。一个block内每个条件有15个试次，结合4个block，每个条件有60个试次。此处的条件指的是标签和匹配的组合
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

// // 输入带颜色的图形,获取该图形配对的标签与颜色（建立带颜色图形与标签的map后就没用了）
// function getLabelAndColorByRandomShape(coloredPath) {
//   // 移除文件名中的颜色部分
//   const seqshape = coloredPath.replace(/[^/]+$/, filename => {
//     return filename.replace(/^[\w-]+_/, ''); 
//   });

//   // 根据图形名称获取标签和颜色
//   seqlabel = ShapeLabelMap.get(seqshape);
//   seqcolor = ShapeColorMap.get(seqshape);
//   return {seqlabel, seqcolor};
// }


// 创建TaskRelevance所有试次
function createTrials(n, phase, task) {  // 根据任务，n-back数，练习与正式实验创建不同的试次。
    const n_back = n;   // 认知负荷n值;
    const trials = [];

    // 存储所有实验条件，实验条件为label_types和is_match的组合，2*2=4
    const allConditions = [];

    if(task === config.task.TR){
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
    }else if(task === config.task.TIR){
        config.color_types.forEach(colorType => {
            // 匹配试次
            allConditions.push({
                color_type: colorType,
                is_match: true,
                count: 0
            });

            // 不匹配试次
            allConditions.push({
                color_type: colorType,
                is_match: false,
                count: 0
            });
        });
    }
    
    // 计算总试次数
    const trialsPerCondition = config.trialsPerCondition[phase];  // 获取练习/正式实验每个条件的重复次数，值为3/15
    const aBlockTrials = trialsPerCondition * allConditions.length;  // 计算练习/正式实验单个block总试次数，值为12/60

    // 生成单个试次，循环至所有试次完成，共12/60次
    while (trials.length < aBlockTrials) {
        const availableConditions = allConditions.filter(c => c.count < trialsPerCondition);   // 返回未满3/15次重复的所有条件。
        if (availableConditions.length === 0) break;

        // 1. 确定试次的实验条件：随机选择一个实验条件
        const randomIndex = Math.floor(Math.random() * availableConditions.length);
        const condition = availableConditions[randomIndex];   

        // 2. 确定试次的图形序列长度：随机生成图形序列长度
        const seqLength = Math.floor(Math.random() * (config.max_sequence - config.min_sequence + 1)) + config.min_sequence;  // 取值在3-5之间，包括首尾

        // 3. 确定试次的目标位置索引
        const targetIndex = seqLength - n_back;  // 目标位置索引应该不用-1

        // 4. 确定试次中呈现的标签、序列图片、图片对应的标签
        const shapes = [];
        const labels = [];
        const colors = [];

        // 自我与任务有关条件
        if(task === config.task.TR){

            const displayLabel = condition.label_type;  // 当前试次显示的标签

            for (let j = 0; j < seqLength; j++) {  // 循环生成所有试次

            if (j === targetIndex) {
                if (condition.is_match) {
                    // 目标位置，匹配条件，随机输出一个与标签配对的带颜色图形；
                    const matchShapes = [...ColoredShapeLabelMap.keys()].filter(
                        key => ColoredShapeLabelMap.get(key) === displayLabel
                    );
                    seqshape = matchShapes[Math.floor(Math.random() * matchShapes.length)];
                    shapes.push(seqshape);

                }else {
                    // 目标位置，不匹配条件，随机输出与标签不配对的带颜色图形；
                    const mismatchShapes = [...ColoredShapeLabelMap.keys()].filter(
                        key => ColoredShapeLabelMap.get(key) !== displayLabel
                    );
                    seqshape = mismatchShapes[Math.floor(Math.random() * mismatchShapes.length)];
                    shapes.push(seqshape);
                }
            } else {
                // 非目标位置，随机选择一个图形
                seqshape = colored_shapes[Math.floor(Math.random() * colored_shapes.length)];
                shapes.push(seqshape);
            }
            // 获取序列图形对应的标签
            seqlabel = ColoredShapeLabelMap.get(seqshape);
            labels.push(seqlabel);  // 获取图形对应的标签
        }

        // 获取目标位置的图形以及图形对应的标签
        const targetShape = shapes[targetIndex];
        const targetLabel = labels[targetIndex];

        // 生成试次数据
        trials.push({
            phase: phase,
            n_back: n_back,
            task: task,
            condition_type: condition,
            sequence: shapes,
            target_shape: targetShape,
            target_label: targetLabel,
            display_label: displayLabel,
            correct_response: condition.is_match ? key[0] : key[1],
        });
    
    }else if(task === config.task.TIR){

            const displayColor = condition.color_type;

            for (let j = 0; j < seqLength; j++) {
            if (j === targetIndex) {
                if (condition.is_match) {
                    // 目标位置，匹配条件，随机输出一个与标签配对的带颜色图形；
                    const matchShapes = [...ColoredShapeColorMap.keys()].filter(
                        key => ColoredShapeColorMap.get(key) === displayColor
                    );
                    seqshape = matchShapes[Math.floor(Math.random() * matchShapes.length)];
                    shapes.push(seqshape);
                }else {
                    // 目标位置，不匹配条件，随机输出与标签不配对的带颜色图形；
                    const mismatchShapes = [...ColoredShapeColorMap.keys()].filter(
                        key => ColoredShapeColorMap.get(key) !== displayColor
                    );
                    seqshape = mismatchShapes[Math.floor(Math.random() * mismatchShapes.length)];
                    shapes.push(seqshape);
                }
            } else {
                // 非目标位置，随机选择一个图形
                seqshape = colored_shapes[Math.floor(Math.random() * colored_shapes.length)];
                shapes.push(seqshape);
            }
            // 获取序列图形对应的标签
            seqcolor = ColoredShapeColorMap.get(seqshape);
            colors.push(seqcolor);  // 获取图形对应的标签
        }

        // 获取目标位置的图形以及图形对应的标签
        const targetShape = shapes[targetIndex];
        const targetColor = colors[targetIndex];

        // 生成试次数据
        trials.push({
            phase: phase,
            n_back: n_back,
            task: task,
            condition_type: condition,
            sequence: shapes,
            target_shape: targetShape,
            target_color: targetColor,
            display_color: displayColor,
            correct_response: condition.is_match ? key[0] : key[1],
        });
    
    }

        // 更新该条件的计数
        condition.count++;
    }

    return {trials, aBlockTrials};   // 返回试次和单个block的总试次数 
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
                    return `<div style="font-size: 60px;">${trial.display_color}</div>`;
                }
            },
            choices: ['f', 'j'],
            stimulus_duration: config.label_duration,
            trial_duration: config.response_window,
            response_ends_trial: true,
            data: {
                subj_idx: id,
                phase: trial.phase,
                stage: 'response',
                 condition_type: trial.condition_type,
                TaskRelevance: trial.task,
                CognitiveLoad: trial.n_back,   // 认知负荷n值
                isMatch: trial.condition_type.is_match,   // 是否匹配
                display_label: trial.display_label,
                display_color: trial.display_color,
                sequence: trial.sequence.join(','),
                target_shape: trial.target_shape,
                target_color: trial.target_color,
                target_label: trial.target_label,
                correct_response: trial.correct_response
            },
            on_start: function () {
                console.log('前2个图形是', trial.target_shape);
                // data.correct_response = trial.correct_response;
                console.log('data.correct_response', trial.correct_response)
            },
            on_finish: function (data) {
                data.correct_response = trial.correct_response;
                console.log('data.keypress', data.response)
                data.correct = data.correct_response == data.response;   // 按键正确与否
                console.log('data.correct', data.correct)
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
  ColoredShapeLabelMap.set(coloredShape, ShapeLabelMap.get(baseShape));  // 建立带颜色图形与标签的映射
  ColoredShapeColorMap.set(coloredShape, ShapeColorMap.get(baseShape));  // 建立带颜色图形与颜色的映射

});


// 3. 按被试ID随机按键
key = permutation(key, 2)[parseInt(id) % 2];// 根据ID随机按键

// console.log('随ID随机的按键', key);
// console.log('图形-标签配对', ShapeLabelMap);
// console.log('图形-颜色配对', ShapeColorMap);
// console.log('带颜色的图形-标签配对', ColoredShapeLabelMap);
// console.log('带颜色的图形-颜色配对', ColoredShapeColorMap);


// 4. 生成试次

// 练习阶段
TR_high_prac_result = createTrials(n=config.n.high, phase='prac', task=config.task.TR);  // 自我与任务有关，高认知负荷
TR_low_prac_result = createTrials(n=config.n.low, phase='prac', task=config.task.TR);  // 自我与任务有关，低认知负荷
TIR_high_prac_result = createTrials(n=config.n.high, phase='prac', task=config.task.TIR);  // 自我与任务无关，高认知负荷
TIR_low_prac_result = createTrials(n=config.n.low, phase='prac', task=config.task.TIR);  // 自我与任务无关，低认知负荷

// 正式实验阶段
TR_high_main_result = createTrials(n=config.n.high, phase='main', task=config.task.TR);  // 自我与任务有关，高认知负荷
TR_low_main_result = createTrials(n=config.n.low, phase='main', task=config.task.TR);  // 自我与任务有关，低认知负荷
TIR_high_main_result = createTrials(n=config.n.high, phase='main', task=config.task.TIR);  // 自我与任务无关，高认知负荷
TIR_low_main_result = createTrials(n=config.n.low, phase='main', task=config.task.TIR);  // 自我与任务无关，低认知负荷


// console.log('TR_high_prac所有试次', TR_high_prac_result.trials)
// console.log('TR_high_main所有试次', TR_high_main_result.trials)
// console.log('TR_low_prac所有试次', TR_low_prac_result.trials)
// console.log('TR_low_main所有试次', TR_low_main_result.trials)
// console.log('TIR_high_prac所有试次', TIR_high_prac_result.trials)
// console.log('TIR_high_main所有试次', TIR_high_main_result.trials)
// console.log('TIR_low_prac所有试次', TIR_low_prac_result.trials)
// console.log('TIR_low_main所有试次', TIR_low_main_result.trials)


// ====================信息采集阶段==================== //
// // 欢迎语
// var welcome = {
//     type: jsPsychHtmlKeyboardResponse,
//     stimulus: `
//      <p>您好，欢迎参加本次实验。</p>
//      <p>为充分保障您的权利，请确保您已经知晓并同意《参与实验同意书》以及《数据公开知情同意书》。</p>
//      <p>如果您未见过上述内容，请咨询实验员。</p>
//      <p>如果您选择继续实验，则表示您已经清楚两份知情同意书的内容并同意。</p>
//      <p> <div style = "color: green"><按任意键至下页></div> </p>
//      `,
//     choices: "ALL_KEYS",
// };
// timeline.push(welcome);


// // 基本信息指导语
// var basic_information = {
//     type: jsPsychHtmlKeyboardResponse,
//     stimulus: `
//      <p>本实验首先需要您填写一些基本个人信息。</p>
//      <p> <div style = "color: green"><按任意键至下页></div></p>
//      `,
//     choices: "ALL_KEYS",
// };
// timeline.push(basic_information);


// // 基本信息收集
// var information = {
//     timeline: [
//         {//探测被试显示器数据
//             type: jsPsychCallFunction,
//             func: function () {
//                 if ($(window).outerHeight() < 500) {
//                     alert("您设备不支持实验，请退出全屏模式。若已进入全屏，请换一台高分辨率的设备，谢谢。");
//                     window.location = "";
//                 }
//             }
//         },
//         {//收集性别
//             type: jsPsychHtmlButtonResponse,
//             stimulus: "<p style = 'color : white'>您的性别</p>",
//             choices: ['男', '女', '其他'],
//             on_finish: function (data) {
//                 info["Sex"] = data.response == 0 ? "Male" : (data.response == 1 ? "Female" : "Other")   // 若反应为0则转为Male,反应为1转为female,其他值转为other
//             }
//         },
//         {//收集出生年
//             type: jsPsychSurveyHtmlForm,
//             preamble: "<p style = 'color : white'>您的出生年</p>",
//             html: function () {
//                 let data = localStorage.getItem(info["subj_idx"]) ? JSON.parse(localStorage.getItem(info["subj_idx"]))["BirthYear"] : "";// 提示用户输入1900~2023数值，若输入超过4位数则截取前四位
//                 return `<p>
//         <input name="Q0" type="number" value=${data} placeholder="1900~2023" min=1900 max=2023 oninput="if(value.length>4) value=value.slice(0,4)" required />
//         </p>`
//             },
//             button_label: '继续',
//             on_finish: function (data) {
//                 info["BirthYear"] = data.response.Q0;
//             }
//         },
//         {//收集教育经历
//             type: jsPsychSurveyHtmlForm,
//             preamble: "<p style = 'color : white'>您的教育经历是</p>",
//             html: function () {
//                 return `
//                 <p><select name="Q0" size=10>
//                 <option value=1>小学以下</option>
//                 <option value=2>小学</option>
//                 <option value=3>初中</option>
//                 <option value=4>高中</option>
//                 <option value=5>大学</option>
//                 <option value=6>硕士</option>
//                 <option value=7>博士</option>
//                 <option value=8>其他</option>
//                 </select></p>`
//             },
//             on_load: function () {
//                 $("option[value=" + (["below primary school", "primary school", "junior middle school", "high school", "university", "master", "doctor", "other"].indexOf(localStorage.getItem(info["subj_idx"]) ? JSON.parse(localStorage.getItem(info["subj_idx"]))["Education"] : "") + 1) + "]").attr("selected", true);
//             },
//             button_label: '继续',
//             on_finish: function (data) {
//                 let edu = ["below primary school", "primary school", "junior middle school", "high school", "university", "master", "doctor", "other"];

//                 info["Education"] = edu[parseInt(data.response.Q0) - 1];
//             }
//         }
//     ]
// };
// timeline.push(information);


// ====================设备调整阶段==================== //

// // 测试被试和显示器之间的距离
// var chinrest = {
//     type: jsPsychVirtualChinrest,
//     blindspot_reps: 3,
//     resize_units: "deg",
//     pixels_per_unit: 50,
//     //SOS，改
//     item_path: '../img/card.png',
//     adjustment_prompt: function () {
//         // let 类似于var 声明对象为变量，常用let而不是var
//         let html = `<p style = "font-size: 28px">首先，我们将快速测量您的显示器上像素到厘米的转换比率。</p>`;
//         html += `<p style = "font-size: 28px">请您将拿出一张真实的银行卡放在屏幕上方，单击并拖动图像的右下角，直到它与屏幕上的信用卡大小相同。</p>`;
//         html += `<p style = "font-size: 28px">您可以使用与银行卡大小相同的任何卡，如会员卡或驾照，如果您无法使用真实的卡，可以使用直尺测量图像宽度至85.6毫米。</p>`;
//         html += `<p style = "font-size: 28px"> 如果对以上操作感到困惑，请参考这个视频： <a href='https://www.naodao.com/public/stim_calibrate.mp4' target='_blank' style='font-size:24px'>参考视频</a></p>`;
//         return html
//     },
//     blindspot_prompt: function () {
//         // <br>为换行标签，<a href >为超链接标签
//         return `<p style="text-align:left">现在，我们将快速测量您和屏幕之间的距离：<br>
//       请把您的左手放在 空格键上<br>
//       请用右手遮住右眼<br>
//       请用您的左眼专注于黑色方块。将注意力集中在黑色方块上。<br>
//       如果您已经准备好了就按下 空格键 ，这时红色的球将从右向左移动，并将消失。当球一消失，就请再按空格键<br>
//       如果对以上操作感到困惑，请参考这个视频：<a href='https://www.naodao.com/public/stim_calibrate.mp4' target='_blank' style='font-size:24px'>参考视频</a><br>
//       <a style="text-align:center">准备开始时，请按空格键。</a></p>`
//     },
//     blindspot_measurements_prompt: `剩余测量次数：`,
//     on_finish: function (data) {
//         console.log(data)
//     },
//     redo_measurement_button_label: `还不够接近，请重试`,
//     blindspot_done_prompt: `是的`,
//     adjustment_button_prompt: `图像大小对准后，请单击此处`,
//     viewing_distance_report: `<p>根据您的反应，您坐在离屏幕<span id='distance-estimate' style='font-weight: bold;'></span> 的位置。<br>这大概是对的吗？</p> `,
// };
// timeline.push(chinrest)


// // 进入全屏
// var fullscreen_trial = {
//     type: jsPsychFullscreen,
//     fullscreen_mode: true,
//     message: "<p><span class='add_' style='color:white; font-size: 35px;'> 实验需要全屏模式，实验期间请勿退出全屏。 </span></p >",
//     button_label: " <span class='add_' style='color:black; font-size: 20px;'> 点击这里进入全屏</span>"
// }
// timeline.push(fullscreen_trial);



// ====================练习阶段函数==================== //

// // 图形-标签匹配任务n-back指导语
// var Tr_instr = {
//     type: jsPsychInstructions,
//     pages: function () {
//         let start = "<p class='header' style = 'font-size: 35px'>请您记住下列图形-标签的对应关系:</p>",
//             middle = "<p class='footer'  style = 'font-size: 35px'>如果对本实验还有不清楚之处，请立即向实验员咨询。</p>",
//             end = "<p style = 'font-size: 35px; line-height: 30px;'>如果您记住了三个对应关系及按键规则，请点击 继续 </span></p><div>";
//         let tmpI = "";
//         view_shape_label.forEach(v => {   // 呈现图形标签对应关系
//             tmpI += `<p class="content" style='font-size:35px'>${v}</p>`;
//         });
//         return [`
//             <p style='color:white; font-size: 35px;line-height: 40px;'>您好,欢迎参加本实验！</p>
//             <p style='color:white; font-size: 35px;line-height: 40px;'>本次实验大约需要50分钟完成。您需要根据提示完成任务，</p>
//             <p style='color:white; font-size: 35px;line-height: 40px;'>现在您需要学习图形与标签的匹配关系。</p>`,
//             start + `<div class="box">${tmpI}</div>`,
//             `<p class='footer' style='font-size: 35px; line-height: 40px;'>当前任务中，屏幕中央将序列呈现图片与标签，</p>
//             <p class='footer' style='font-size: 35px; line-height: 40px;'>您需要在标签出现时,判断前${config.n.high}个图形是否与当前标签匹配，</p>
//       <p class='footer' style='color:white; font-size: 35px;line-height: 40px'>如果二者<span style="color: lightgreen;">匹配</span>，请按 <span style="color: lightgreen">${key[0]}键</span>，如果<span style="color: lightgreen;">不匹配</span>，请按<span style="color: lightgreen"> ${key[1]}键。</p>
//        <p line-height: 40px>在实验过程中请将您<span style="color: lightgreen;">左手与右手的食指</span>分别放在电脑键盘的相应键位上准备按键。</p></span>`,
//             `<p style='color:white; font-size: 35px; line-height: 40px;'>接下来，您将进入练习部分，<span style="color: lightgreen;">请您又快又准地进行按键。</span></p>
//       <p style='color:white; font-size: 35px; line-height: 40px;'>通过练习后，您将进入正式实验。</p></span>`,
//             middle + end];
//     },
//     show_clickable_nav: true,
//     button_label_previous: " <span class='add_' style='color:black; font-size: 20px;'> 返回</span>",
//     button_label_next: " <span class='add_' style='color:black; font-size: 20px; '> 继续</span>",
//     on_load: () => {
//         $("body").css("cursor", "default");
//     },// 开始时鼠标出现
//     on_finish: function () {
//         $("body").css("cursor", "none");
//     } //结束时鼠标消失
// }
// timeline.push(Tr_instr);


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
        console.log('练习试次数', trials.count())
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
var recapInstr = { //在这里呈现文字回顾，让被试再记一下
    type: jsPsychInstructions,
    pages: function () {
        let start = "<p class='header' style='font-size:35px; line-height:30px;'>请您努力记住下列对应关系，并再次进行练习。</p>",
            middle = "<p class='footer' style='font-size:35px; line-height:30px;'>如果对本实验还有不清楚之处，请立即向实验员咨询。</p>",
            end = "<p style='font-size:35px; line-height:30px;'>如果您明白了规则：请按 继续 进入练习</p><div>";
        let tmpI = "";
        view_shape_label.forEach(v => {   // 任务相关条件记忆shape-label
            tmpI += `<p class="content" style='font-size:35px'>${v}</p>`;
        });
        return ["<p class='header' style='font-size:35px; line-height:30px;'>您的正确率未达到进入正式实验的要求。</p>",
            start + `<div class="box">${tmpI}</div>`,
            `<p class='footer' style='font-size: 35px; line-height: 40px;'>当前任务中，屏幕中央将序列呈现图片与标签，</p>
            <p class='footer' style='font-size: 35px; line-height: 40px;'>您需要在标签出现时,判断前${config.n.high}个图形是否与当前标签匹配，</p>
      <p class='footer' style='color:white; font-size: 35px;line-height: 40px'>如果二者<span style="color: lightgreen;">匹配</span>，请按 <span style="color: lightgreen">${key[0]}键</span>，如果<span style="color: lightgreen;">不匹配</span>，请按<span style="color: lightgreen"> ${key[1]}键。</p>            
      </span><p class='footer' style='color: lightgreen; font-size:35px; line-height:30px;'>请您又快又准地进行按键。</p></span>`,
            middle + end];
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


// 判断是否重新练习
function reprac_if_node(condition_result){
    return{
        timeline: [
            recapInstr
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
    console.log(condition_result, '练习阶段开始啦')
    return [
        reprac_loop_node(condition_result), // 循环练习阶段
    ];
}
// timeline.push(...createPracticeBlock(TR_high_prac_result)); // TR低难度练习


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

// timeline.push(Congrats);


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
let resid_block_numb = 3;// 此处填入总block数量-1，比如总数量是3，那么值就需要是2
let rest = {
    type: jsPsychHtmlButtonResponse,
    stimulus: function () {
        let totaltrials = jsPsych.data.get().filter(
            [{ correct: true }, { correct: false }]
        );
        return `
                    <p>图形-标签匹配任务中，您还剩余${resid_block_numb}组实验</p>
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


// 完整的正式实验设置
function createMainBlock(condition_result) {
    console.log(condition_result, '正式实验开始啦')
    return [
        {
            timeline: [
                Block(condition_result),
                mainBlockFeedback(condition_result),
                rest
            ],
            repetitions: config.rep_block
        }

    ];
}
// timeline.push(...createMainBlock(TR_high_main_result)); // TR低难度正式实验


// 完整的单个任务设置：练习+正式实验
function createTaskTrials(prac_result, main_result) {
    return [
        {
            timeline: [
                ...createPracticeBlock(prac_result),
                Congrats,
                ...createMainBlock(main_result)
            ],
        }

    ];
}


// ====================4种任务的时间线封装==================== //
timeline.push(...createTaskTrials(prac_result = TR_high_prac_result, main_result = TR_high_main_result)); // TR低难度正式实验
// timeline.push(...createTaskTrials(prac_result = TR_high_prac_result, main_result = TR_high_main_result)); // TR低难度正式实验
// timeline.push(...createTaskTrials(prac_result = TIR_high_prac_result, main_result = TIR_high_main_result)); // TR低难度正式实验
// timeline.push(...createTaskTrials(prac_result = TIR_high_prac_result, main_result = TIR_high_main_result)); // TR低难度正式实验




// ====================下阶段的目标是将4个任务分别封装成独立模块并实现调用顺序随id随机==================== //


// // 实验结束语
// var finish = {
//     type: jsPsychHtmlKeyboardResponse,
//     stimulus: `
//         <p>感谢您参加我们的实验，请<span style="color: yellow;">按任意键开始下载数据</span>，并通知实验员。</p>
//         <p>感谢您的配合！</p>`,
//     choices: "ALL_KEYS",
// };
// timeline.push(finish);


// 运行实验
jsPsych.run(timeline);

