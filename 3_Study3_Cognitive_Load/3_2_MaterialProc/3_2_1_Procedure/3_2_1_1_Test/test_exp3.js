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
// 有必要加载带颜色的图片
var shape_images = [   // 指导语中呈现的刺激--无颜色的形状
    '../img/circle.png',
    '../img/square.png',
    '../img/triangle.png'
]
var preload = {
    type: jsPsychPreload,
    images: [...shape_images] // 合并数组
}
timeline.push(preload);


// ====================实验参数设置==================== //
var info = []   // 存储被试信息
var key = ['f', 'j']   // 被试按键
var view_shape_label = []   // 存储shape-label配对
var view_shape_color = []   // 存储shape-color配对   
var ShapeColorMap = new Map();   // 存储图形-颜色对
var ShapeLabelMap = new Map();   // 存储图形-标签对
var colors = ['red', 'blue', 'green'];   // 颜色列表，可能用不到


const config = {
    n: 2, // 设置n-back的n值（例如2-back） [1, 2, 3]
    min_sequence: 3,   // 最小序列长度 (n + 1)
    max_sequence: 5,   // 最大序列长度
    acc: 70,   // 正确率70%才能通过练习
    fixation_duration: 500,
    shape_duration: 500,
    label_duration: 1500,
    response_window: 2000,
    feedback_duration: 300,
    isi: 500,   // 图形间隔

    trialsPerCondition: {
        prac: 3,   // 练习阶段每个条件3次，共练习18次
        main: 15       // 正式实验每个条件15次。重复5个block，每个条件试次有75个
    },

    // 标签类型列表
    label_types: ['自我', '朋友', '生人'],
    color_types: ["红色", "蓝色", "绿色"],
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

// createTRTrials辅助函数：随机获取不匹配的标签(排除目标标签)
function getRandomNonMatchingLabel(target) {
    const availableLabels = config.label_types.filter(l => l !== target);   // 返回非目标标签
    return availableLabels[Math.floor(Math.random() * availableLabels.length)];   // 返回随机非目标标签
}

// 创建TaskRelevance所有试次
function createTRTrials(phase) {  // 根据phase参数区分练习和正式实验
    const trials = [];

    // 存储所有实验条件，实验条件为label_types和is_match的组合，取值取决于label_types
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
    const trialsPerCondition = config.trialsPerCondition[phase];  // 获取练习/正式实验单个block重复次数，值为3/15
    const allTrials = trialsPerCondition * allConditions.length;  // 计算练习/正式实验单个block总试次数，值为12/60

    // 循环，逐次生成12/60个试次，每个条件都重复3/15次
    while (trials.length < allTrials) {
        const availableConditions = allConditions.filter(c => c.count < trialsPerCondition);   // 返回未满3/15次重复的条件。
        if (availableConditions.length === 0) break;

        // 1. 确定试次的实验条件：随机选择一个实验条件
        const randomIndex = Math.floor(Math.random() * availableConditions.length);
        const condition = availableConditions[randomIndex];   

        // 2. 确定试次的图形序列长度：随机生成图形序列长度
        const seqLength = Math.floor(Math.random() * (config.max_sequence - config.min_sequence + 1)) + config.min_sequence;  // 取值在3-5之间，包括首尾

        // 3. 确定试次中序列的内容，序列呈现的图形、对应的标签、对应的颜色
        const shapes = [];
        const labels = [];
        const colors = [];
        const allShapes = Array.from(ShapeLabelMap.keys());  // 获取所有图形

        for (let j = 0; j < seqLength; j++) {  // 根据seqLength长度指定循环次数
            // 随机选择图形
            const randomShape = allShapes[Math.floor(Math.random() * allShapes.length)];  // 获取图形序列中的某次呈现的图形
            shapes.push(randomShape);
            labels.push(ShapeLabelMap.get(randomShape));  // 获取图形对应的标签
            colors.push(ShapeColorMap.get(randomShape));  // 获取图形对应的颜色
            // console.log('labels', labels);
        }

        // 4. 确定试次的目标图形（第前n个图形）及其对应的标签与颜色
        const targetIndex = seqLength - config.n - 1;  // 目标位置索引应该不用-1
        const targetLabel = labels[targetIndex];
        const targetShape = shapes[targetIndex];
        const targetColor = colors[targetIndex];

        // console.log('colors', colors);

        // 5. 确定试次呈现的待判断标签
        let displayLabel;
        if (condition.is_match) {
            displayLabel = targetLabel; // 匹配试次：显示图形对应的真实标签
        } else {
            displayLabel = getRandomNonMatchingLabel(targetLabel); // 不匹配试次：显示其他标签
        }

        // 6. 创建试次数据
        trials.push({
            phase: phase,
            sequence: shapes,
            target_shape: targetShape,
            target_color: targetColor,
            target_label: targetLabel,
            display_label: displayLabel,
            correct_response: condition.is_match ? key[0] : key[1],
            condition_type: condition
        });

        // 7. 更新该条件的计数
        condition.count++;
    }

    return trials;
}


// createTIRTrials辅助函数：获取不匹配的颜色(排除目标颜色)
function getRandomNonMatchingColor(target) {
    const availableLabels = config.color_types.filter(l => l !== target);   // 返回非目标标签
    return availableLabels[Math.floor(Math.random() * availableLabels.length)];   // 返回随机非目标标签
}

// 创建TaskIrrelevance试次
function createTIRTrials(phase) {
    const trials = [];

    // 生成所有可能的条件组合
    const allConditions = [];

    // 每个标签类型 * 匹配类型 = 6
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

    // 计算总试次数
    const trialsPerCondition = config.trialsPerCondition[phase];
    const allTrials = trialsPerCondition * allConditions.length;

    // 循环直到所有条件达到目标次数
    while (trials.length < allTrials) {
        // 随机选择一个未满的条件
        const availableConditions = allConditions.filter(c => c.count < trialsPerCondition);   // 返回所有试次数没到指定试次数的条件
        if (availableConditions.length === 0) break;

        const randomIndex = Math.floor(Math.random() * availableConditions.length);
        const condition = availableConditions[randomIndex];   // 随机选择一个条件进行试次填充

        // 1. 随机生成图形序列长度
        const seqLength = Math.floor(Math.random() * (config.max_sequence - config.min_sequence + 1)) + config.min_sequence;

        // 2. 创建图形序列
        const shapes = [];
        const colors = [];
        const labels = [];
        const allShapes = Array.from(ShapeLabelMap.keys());

        // 生成长度随机的图形序列
        for (let j = 0; j < seqLength; j++) {
            // 完全随机选择图形
            const randomShape = allShapes[Math.floor(Math.random() * allShapes.length)];
            shapes.push(randomShape);
            labels.push(ShapeLabelMap.get(randomShape));
            colors.push(ShapeColorMap.get(randomShape));
        }

        // 3. 确定目标位置索引
        const targetIndex = seqLength - config.n - 1;
        // 获取目标图形的实际颜色
        const targetColor = colors[targetIndex];
        const targetLabel = labels[targetIndex];
        const targetShape = shapes[targetIndex];

        // 4. 生成显示的标签
        let displayColor;
        if (condition.is_match) {
            displayColor = targetColor; // 匹配试次：显示图形对应的真实颜色
        } else {
            displayColor = getRandomNonMatchingColor(targetColor); // 不匹配试次：显示其他颜色
        }

        // 5. 创建试次数据
        trials.push({
            phase: phase,
            sequence: shapes,
            target_shape: targetShape,
            target_color: targetColor,
            target_label: targetLabel,
            display_color: displayColor,
            correct_response: condition.is_match ? key[0] : key[1],
            condition_type: condition
        });

        // 更新该条件的计数
        condition.count++;
    }

    return trials;
}

function createTrialTimeline(trials) {
    const timeline = [];

    // 遍历每个试次
    trials.forEach(trial => {
        console.log(trial);

        // 1. 注视点
        timeline.push({
            type: jsPsychHtmlKeyboardResponse,
            stimulus: '<div style="font-size: 60px;">+</div>',
            choices: "NO_KEYS",
            trial_duration: config.fixation_duration
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
            stimulus: `<div style="font-size: 60px;">${trial.display_label}</div>`,
            choices: ['f', 'j'],
            trial_duration: config.response_window,
            response_ends_trial: true,
            data: {
                phase: trial.phase,
                stage: 'response',
                sequence: trial.sequence.join(','),
                target_shape: trial.target_shape,
                target_color: trial.target_color,
                target_label: trial.target_label,
                display_label: trial.display_label,
                correct_response: trial.correct_response,
                condition_type: trial.condition_type,
                condition: 'TaskRelevant',
                subj_idx: id
            },
            on_start: function () {
                console.log('前2个图形是', trial.target_shape);
                console.log('呈现的标签是', trial.display_label);
            },
            on_finish: function (data) {
                data.correct_response = trial.correct_response;
                console.log('data.correct_response', data.correct_response)
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
                console.log('单个试次反馈里的keypress', keypress)
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

// 1. 按被试ID随机配对图形-标签/图形-颜色；ShapeLabelMap, ShapeColorMap
shape_images = permutation(shape_images, 3)[parseInt(id) % 6]

// 二次随机img，S-L上下位置不一样   
jsPsych.randomization.shuffle(shape_images).forEach((v, i) => {
    view_shape_label.push(`<img src="${v}" width=140 style="vertical-align:middle"><span style=" font-size: 35px;">&nbsp-----&nbsp${config.label_types[shape_images.indexOf(v)]}</span>`);   // texts不需要随机,shape_images存储的是第一次根据ID随机抽取的结果；使用shape_images.indexOf(v)能够返回二次随机图形在一次随机中的索引值，这是个固定值，然后再根据此索引调出labels对应的值；view_texts_images存储的是v,v的值不变，所以图形-标签值不变，但v的顺序被shuffle，所以出现的图形-标签出现的顺序会变。
    ShapeLabelMap.set(v, `${config.label_types[shape_images.indexOf(v)]}`);// 存储图形-标签键值对，用于timelinevariable
    view_shape_color.push(`<img src="${v}" width=140 style="vertical-align:middle"><span style=" font-size: 35px;">&nbsp-----&nbsp${config.color_types[shape_images.indexOf(v)]}</span>`);
    ShapeColorMap.set(v, `${config.color_types[shape_images.indexOf(v)]}`);// 存储图形-颜色键值对，用于timelinevariable
});

// 2. 按被试ID随机按键
key = permutation(key, 2)[parseInt(id) % 2];// 根据ID随机按键

console.log('随ID随机的按键', key);
console.log('图形-标签配对', ShapeLabelMap);
console.log('图形-颜色配对', ShapeColorMap);

// 3. 生成所有试次：随机长度图形序列、呈现标签、ismatch与shaps平衡，6个条件试次数量相等
TR_prac_trials = createTRTrials('prac');
TR_main_trials = createTRTrials('main');
TIR_prac_trials = createTIRTrials('prac');
TIR_main_trials = createTIRTrials('main');

console.log('TR_prac_trials', TR_prac_trials)
// console.log('TR_main_trials', TR_main_trials)
// console.log('TIR_prac_trials', TIR_prac_trials)
// console.log('TIR_main_trials', TIR_main_trials)

// 4. 生成试次
const TR_prac = createTrialTimeline(TR_prac_trials)
timeline.push(...TR_prac);



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
//             <p style='color:white; font-size: 35px;line-height: 40px;'>本次实验大约需要X分钟完成。您需要根据提示完成任务，</p>
//             <p style='color:white; font-size: 35px;line-height: 40px;'>现在您需要学习图形与标签的匹配关系。</p>`,
//             start + `<div class="box">${tmpI}</div>`,
//             `<p class='footer' style='font-size: 35px; line-height: 40px;'>当前任务中，屏幕中央将序列呈现图片与标签，</p>
//             <p class='footer' style='font-size: 35px; line-height: 40px;'>您需要在标签出现时,判断前${n}个图形是否与当前标签匹配，</p>
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



// ====================下一阶段的目标就是把练习试次跑通！！==================== //



// // 任务有关条件：练习阶段（呈现带颜色的图形+标签，进行图形标签匹配任务）
// var TR_prac = {
//     timeline: [
//         {   // 单个试次
//             type: jsPsychPsychophysics,
//             stimuli: [
//                 {
//                     obj_type: 'cross',   // 注视点
//                     startX: "center",
//                     startY: "center",
//                     line_length: 40, // pixels 视角：0.8° x 0.8°
//                     line_width: 5,
//                     line_color: 'white',
//                     show_start_time: 500,
//                     show_end_time: 1100   // 1100
//                 },
//                 {
//                     obj_type: "image",   // colored_shapes
//                     file: function () { return jsPsych.timelineVariable("pres_stml")() },
//                     startX: "center",
//                     startY: -200,   // 肉眼等距
//                     scale: 0.7,   // 图片缩小0.7倍
//                     width: 190,   // 调整图片大小 视角：3.8° x 3.8°
//                     heigth: 190,   // 调整图片大小 视角：3.8° x 3.8°
//                     show_start_time: 1000,
//                     show_end_time: 1100,   // 1100
//                     origin_center: true
//                 },
//                 {
//                     obj_type: 'text',
//                     file: function () { return jsPsych.timelineVariable("pres_label")() },
//                     startX: "center",
//                     startY: 140, //140，图形和文字距离 与加号等距2度
//                     content: function () {
//                         return jsPsych.timelineVariable('pres_label', true)();
//                     },
//                     font: `${80}px 'Arial'`, //字体和颜色设置 文字视角：3.6° x 1.6°
//                     text_color: 'white',
//                     show_start_time: 1000,
//                     show_end_time: 1100,   // 1100
//                     origin_center: true
//                 }
//             ],

//             choices: ['f', 'j'],
//             response_start_time: 1000,
//             trial_duration: 2500,
//             on_start: function () {
//                 console.log('呈现的标签：', jsPsych.timelineVariable('pres_label', true)());
//                 console.log('图形-标签对：', ShapeColorMap);
//                 console.log('图形配对的标签：', jsPsych.timelineVariable("paired_label", true)());
//                 console.log('正确的按键：', jsPsych.timelineVariable("identify", true)());
//             },
//             on_finish: function (data) {
//                 data.correct_response = jsPsych.timelineVariable("identify", true)();   // 正确按键
//                 data.correct = data.correct_response == data.key_press;   // 按键正确与否
//                 data.labels = jsPsych.timelineVariable('pres_label', true)();   // 呈现的标签
//                 data.shapes = jsPsych.timelineVariable("paired_label", true)();   // 图形配对的标签
//                 data.pres_colors = jsPsych.timelineVariable("pres_color", true)();   // 呈现的颜色
//                 data.paired_colors = jsPsych.timelineVariable("paired_color", true)();   // 配对的颜色
//                 data.ismatch = data.labels == data.shapes;   // 图形与标签是否匹配
//                 data.condition = "TR_prac";   // 标记为练习阶段
//                 data.subj_idx = id
//             }
//         },
// {   // 每个试次后反馈
//     type: jsPsychHtmlKeyboardResponse,
//         stimulus: function () {
//             let keypress = jsPsych.data.get().last(1).values()[0].key_press; // 被试按键
//             let time = jsPsych.data.get().last(1).values()[0].rt;
//             let trial_correct_response = jsPsych.data.get().last(1).values()[0].correct_response;//该trial正确的按键
//             if (time > 1500 || time === null) { //大于1500或为null为过慢
//                 return "<span class='add_' style='color:yellow; font-size: 70px;'> 太慢! </span>"
//             } else if (time < 200) { //小于两百为过快反应
//                 return "<span style='color:yellow; font-size: 70px;'>过快! </span>"
//             } else {
//                 if (keypress == trial_correct_response) { //如果按键 == 正确按键
//                     return "<span style='color:GreenYellow; font-size: 70px;'>正确! </span>"
//                 }
//                 else {
//                     return "<span style='color:red; font-size: 70px;'>错误! </span>"
//                 }
//             }
//         },

//     choices: "NO_KEYS",
//         trial_duration: 300,
//             data: {
//         screen_id: "feedback_test"
//     },
// }
//     ],
//     timeline_variables: [
//         // 36个试次
//         // colShapes用于试次呈现；shape用于数据存储图形的身份（自我/朋友/生人）；color用于数据存储图形的颜色；labels用于试次呈现的标签；identify用于试次正确按键
//         { pres_stml: function () { return colored_shapes[0] }, pres_color: function () { return pres_colors[0] }, paired_color: function () { return paired_colors[0] }, pres_label: function () { return pres_labels[0][0] }, paired_label: function () { return paired_labels[0] }, identify: function () { return key[0] } },
//         { pres_stml: function () { return colored_shapes[0] }, pres_color: function () { return pres_colors[0] }, paired_color: function () { return paired_colors[0] }, pres_label: function () { return pres_labels[0][0] }, paired_label: function () { return paired_labels[0] }, identify: function () { return key[0] } },
//         { pres_stml: function () { return colored_shapes[0] }, pres_color: function () { return pres_colors[0] }, paired_color: function () { return paired_colors[0] }, pres_label: function () { return pres_labels[0][1] }, paired_label: function () { return paired_labels[0] }, identify: function () { return key[1] } },
//         { pres_stml: function () { return colored_shapes[0] }, pres_color: function () { return pres_colors[0] }, paired_color: function () { return paired_colors[0] }, pres_label: function () { return pres_labels[0][2] }, paired_label: function () { return paired_labels[0] }, identify: function () { return key[1] } },

//         { pres_stml: function () { return colored_shapes[1] }, pres_color: function () { return pres_colors[1] }, paired_color: function () { return paired_colors[1] }, pres_label: function () { return pres_labels[1][0] }, paired_label: function () { return paired_labels[1] }, identify: function () { return key[0] } },
//         { pres_stml: function () { return colored_shapes[1] }, pres_color: function () { return pres_colors[1] }, paired_color: function () { return paired_colors[1] }, pres_label: function () { return pres_labels[1][0] }, paired_label: function () { return paired_labels[1] }, identify: function () { return key[0] } },
//         { pres_stml: function () { return colored_shapes[1] }, pres_color: function () { return pres_colors[1] }, paired_color: function () { return paired_colors[1] }, pres_label: function () { return pres_labels[1][1] }, paired_label: function () { return paired_labels[1] }, identify: function () { return key[1] } },
//         { pres_stml: function () { return colored_shapes[1] }, pres_color: function () { return pres_colors[1] }, paired_color: function () { return paired_colors[1] }, pres_label: function () { return pres_labels[1][2] }, paired_label: function () { return paired_labels[1] }, identify: function () { return key[1] } },

//         { pres_stml: function () { return colored_shapes[2] }, pres_color: function () { return pres_colors[2] }, paired_color: function () { return paired_colors[2] }, pres_label: function () { return pres_labels[2][0] }, paired_label: function () { return paired_labels[2] }, identify: function () { return key[0] } },
//         { pres_stml: function () { return colored_shapes[2] }, pres_color: function () { return pres_colors[2] }, paired_color: function () { return paired_colors[2] }, pres_label: function () { return pres_labels[2][0] }, paired_label: function () { return paired_labels[2] }, identify: function () { return key[0] } },
//         { pres_stml: function () { return colored_shapes[2] }, pres_color: function () { return pres_colors[2] }, paired_color: function () { return paired_colors[2] }, pres_label: function () { return pres_labels[2][1] }, paired_label: function () { return paired_labels[2] }, identify: function () { return key[1] } },
//         { pres_stml: function () { return colored_shapes[2] }, pres_color: function () { return pres_colors[2] }, paired_color: function () { return paired_colors[2] }, pres_label: function () { return pres_labels[2][2] }, paired_label: function () { return paired_labels[2] }, identify: function () { return key[1] } },

//         { pres_stml: function () { return colored_shapes[3] }, pres_color: function () { return pres_colors[3] }, paired_color: function () { return paired_colors[3] }, pres_label: function () { return pres_labels[3][0] }, paired_label: function () { return paired_labels[3] }, identify: function () { return key[0] } },
//         { pres_stml: function () { return colored_shapes[3] }, pres_color: function () { return pres_colors[3] }, paired_color: function () { return paired_colors[3] }, pres_label: function () { return pres_labels[3][0] }, paired_label: function () { return paired_labels[3] }, identify: function () { return key[0] } },
//         { pres_stml: function () { return colored_shapes[3] }, pres_color: function () { return pres_colors[3] }, paired_color: function () { return paired_colors[3] }, pres_label: function () { return pres_labels[3][1] }, paired_label: function () { return paired_labels[3] }, identify: function () { return key[1] } },
//         { pres_stml: function () { return colored_shapes[3] }, pres_color: function () { return pres_colors[3] }, paired_color: function () { return paired_colors[3] }, pres_label: function () { return pres_labels[3][2] }, paired_label: function () { return paired_labels[3] }, identify: function () { return key[1] } },

//         { pres_stml: function () { return colored_shapes[4] }, pres_color: function () { return pres_colors[4] }, paired_color: function () { return paired_colors[4] }, pres_label: function () { return pres_labels[4][0] }, paired_label: function () { return paired_labels[4] }, identify: function () { return key[0] } },
//         { pres_stml: function () { return colored_shapes[4] }, pres_color: function () { return pres_colors[4] }, paired_color: function () { return paired_colors[4] }, pres_label: function () { return pres_labels[4][0] }, paired_label: function () { return paired_labels[4] }, identify: function () { return key[0] } },
//         { pres_stml: function () { return colored_shapes[4] }, pres_color: function () { return pres_colors[4] }, paired_color: function () { return paired_colors[4] }, pres_label: function () { return pres_labels[4][1] }, paired_label: function () { return paired_labels[4] }, identify: function () { return key[1] } },
//         { pres_stml: function () { return colored_shapes[4] }, pres_color: function () { return pres_colors[4] }, paired_color: function () { return paired_colors[4] }, pres_label: function () { return pres_labels[4][2] }, paired_label: function () { return paired_labels[4] }, identify: function () { return key[1] } },

//         { pres_stml: function () { return colored_shapes[5] }, pres_color: function () { return pres_colors[5] }, paired_color: function () { return paired_colors[5] }, pres_label: function () { return pres_labels[5][0] }, paired_label: function () { return paired_labels[5] }, identify: function () { return key[0] } },
//         { pres_stml: function () { return colored_shapes[5] }, pres_color: function () { return pres_colors[5] }, paired_color: function () { return paired_colors[5] }, pres_label: function () { return pres_labels[5][0] }, paired_label: function () { return paired_labels[5] }, identify: function () { return key[0] } },
//         { pres_stml: function () { return colored_shapes[5] }, pres_color: function () { return pres_colors[5] }, paired_color: function () { return paired_colors[5] }, pres_label: function () { return pres_labels[5][1] }, paired_label: function () { return paired_labels[5] }, identify: function () { return key[1] } },
//         { pres_stml: function () { return colored_shapes[5] }, pres_color: function () { return pres_colors[5] }, paired_color: function () { return paired_colors[5] }, pres_label: function () { return pres_labels[5][2] }, paired_label: function () { return paired_labels[5] }, identify: function () { return key[1] } },

//         { pres_stml: function () { return colored_shapes[6] }, pres_color: function () { return pres_colors[6] }, paired_color: function () { return paired_colors[6] }, pres_label: function () { return pres_labels[6][0] }, paired_label: function () { return paired_labels[6] }, identify: function () { return key[0] } },
//         { pres_stml: function () { return colored_shapes[6] }, pres_color: function () { return pres_colors[6] }, paired_color: function () { return paired_colors[6] }, pres_label: function () { return pres_labels[6][0] }, paired_label: function () { return paired_labels[6] }, identify: function () { return key[0] } },
//         { pres_stml: function () { return colored_shapes[6] }, pres_color: function () { return pres_colors[6] }, paired_color: function () { return paired_colors[6] }, pres_label: function () { return pres_labels[6][1] }, paired_label: function () { return paired_labels[6] }, identify: function () { return key[1] } },
//         { pres_stml: function () { return colored_shapes[6] }, pres_color: function () { return pres_colors[6] }, paired_color: function () { return paired_colors[6] }, pres_label: function () { return pres_labels[6][2] }, paired_label: function () { return paired_labels[6] }, identify: function () { return key[1] } },

//         { pres_stml: function () { return colored_shapes[7] }, pres_color: function () { return pres_colors[7] }, paired_color: function () { return paired_colors[7] }, pres_label: function () { return pres_labels[7][0] }, paired_label: function () { return paired_labels[7] }, identify: function () { return key[0] } },
//         { pres_stml: function () { return colored_shapes[7] }, pres_color: function () { return pres_colors[7] }, paired_color: function () { return paired_colors[7] }, pres_label: function () { return pres_labels[7][0] }, paired_label: function () { return paired_labels[7] }, identify: function () { return key[0] } },
//         { pres_stml: function () { return colored_shapes[7] }, pres_color: function () { return pres_colors[7] }, paired_color: function () { return paired_colors[7] }, pres_label: function () { return pres_labels[7][1] }, paired_label: function () { return paired_labels[7] }, identify: function () { return key[1] } },
//         { pres_stml: function () { return colored_shapes[7] }, pres_color: function () { return pres_colors[7] }, paired_color: function () { return paired_colors[7] }, pres_label: function () { return pres_labels[7][2] }, paired_label: function () { return paired_labels[7] }, identify: function () { return key[1] } },

//         { pres_stml: function () { return colored_shapes[8] }, pres_color: function () { return pres_colors[8] }, paired_color: function () { return paired_colors[8] }, pres_label: function () { return pres_labels[8][0] }, paired_label: function () { return paired_labels[8] }, identify: function () { return key[0] } },
//         { pres_stml: function () { return colored_shapes[8] }, pres_color: function () { return pres_colors[8] }, paired_color: function () { return paired_colors[8] }, pres_label: function () { return pres_labels[8][0] }, paired_label: function () { return paired_labels[8] }, identify: function () { return key[0] } },
//         { pres_stml: function () { return colored_shapes[8] }, pres_color: function () { return pres_colors[8] }, paired_color: function () { return paired_colors[8] }, pres_label: function () { return pres_labels[8][1] }, paired_label: function () { return paired_labels[8] }, identify: function () { return key[1] } },
//         { pres_stml: function () { return colored_shapes[8] }, pres_color: function () { return pres_colors[8] }, paired_color: function () { return paired_colors[8] }, pres_label: function () { return pres_labels[8][2] }, paired_label: function () { return paired_labels[8] }, identify: function () { return key[1] } },
//     ],
//     randomize_order: true,   //6
//     repetitions: 1,   // 练习重复1次，练习试次36个
//     on_load: () => {
//         $("body").css("cursor", "none");
//     },
//     on_finish: function () {
//         $("body").css("cursor", "default");
//     }
// }
// // 整个练习block反馈
// var TR_prac_feedback = {
//     type: jsPsychHtmlKeyboardResponse,
//     stimulus: function () {
//         let trials = jsPsych.data.get().filter(
//             [{ correct: true }, { correct: false }]
//         ).last(36); //获取练习阶段所有trial数;需要修改
//         let correct_trials = trials.filter({
//             correct: true   // 获取正确的试次
//         });
//         let accuracy = Math.round(correct_trials.count() / trials.count() * 100);   //计算正确率
//         console.log('练习试次数', trials.count())
//         let rt = Math.round(correct_trials.select('rt').mean());   // 计算平均反应时
//         return `
//     <style>
//         .context { color: white; font-size: 35px; line-height: 40px; }
//     </style>
//     <div>
//         <p class='context'>您正确回答了 ${accuracy}% 的试次。</p>
//         <p class='context'>您的平均反应时为 ${rt} 毫秒。</p>
//         <p class='context'>按任意键进入下一页</p>
//     </div>
// `;
//     }
// }
// // 任务相关：再次练习指导语
// var TR_reprac_instr = { //在这里呈现文字回顾，让被试再记一下
//     type: jsPsychInstructions,
//     pages: function () {
//         let start = "<p class='header' style='font-size:35px; line-height:30px;'>请您努力记住下列图形-标签的对应关系，并再次进行练习。</p>",
//             middle = "<p class='footer' style='font-size:35px; line-height:30px;'>如果对本实验还有不清楚之处，请立即向实验员咨询。</p>",
//             end = "<p style='font-size:35px; line-height:30px;'>如果您明白了规则：请按 继续 进入练习</p><div>";
//         let tmpI = "";
//         view_shape_label.forEach(v => {   // 任务相关条件记忆shape-label
//             tmpI += `<p class="content" style='font-size:35px'>${v}</p>`;
//         });
//         return ["<p class='header' style='font-size:35px; line-height:30px;'>您的正确率未达到进入正式实验的要求。</p>",
//             start + `<div class="box">${tmpI}</div>`,
//             `<p class='footer' style='font-size:35px; line-height:30px;'>您的任务是判断图形与标签是否匹配，</p>
//       <p class='footer' style='font-size:35px; line-height:30px;'>如果二者<span style="color: lightgreen;">匹配</span>，请按键盘 <span style="color: lightgreen;">${key[0]}键</span></p>
//       <p class='footer' style='font-size:35px; line-height:30px;'>如果二者<span style="color: lightgreen;">不匹配</span>，请按键盘<span style="color: lightgreen;"> ${key[1]}键</p>
//       </span><p class='footer' style='color: lightgreen; font-size:35px; line-height:30px;'>请您又快又准地进行按键。</p></span>`,
//             middle + end];
//     },
//     show_clickable_nav: true,
//     button_label_previous: " <span class='add_' style='color:black; font-size: 20px;'> 返回</span>",
//     button_label_next: " <span class='add_' style='color:black; font-size: 20px;'> 继续</span>",
//     on_finish: function () {
//         $("body").css("cursor", "none");
//     },
//     on_load: () => {
//         $("body").css("cursor", "default");
//     }
// }
// // 任务相关：判断是否需要再次练习
// var TR_if_node = { //if_node 用于判断是否呈现feedback_matching_task_p，instruction_repractice
//     timeline: [TR_prac_feedback, TR_reprac_instr],
//     conditional_function: function (data) {
//         var trials = jsPsych.data.get().filter(
//             [{ correct: true }, { correct: false }]
//         ).last(36);   // 需要修改
//         var correct_trials = trials.filter({
//             correct: true
//         });
//         var accuracy = Math.round(correct_trials.count() / trials.count() * 100);
//         if (accuracy >= acc) {   // 比较练习阶段ACC与70%的大小
//             return false;   //达标则跳过timeline,进入正式实验
//         } else if (accuracy < acc) { //没达标则进行timeline
//             return true;
//         }
//     }
// }
// // 任务相关：循环练习阶段
// var TR_loop_node = {
//     timeline: [TR_prac, TR_if_node],
//     loop_function: function () {
//         var trials = jsPsych.data.get().filter(
//             [{ correct: true }, { correct: false }]
//         ).last(36);   //需要修改
//         var correct_trials = trials.filter({
//             correct: true
//         });
//         var accuracy = Math.round(correct_trials.count() / trials.count() * 100);
//         if (accuracy >= acc) {
//             return false;   // 正确率达标，不循环，执行一次timeline
//         } else if (accuracy < acc) {    // 不达标，repeat，再执行一次timeline
//             return true;
//         }
//     }
// }
// timeline.push(TR_loop_node);


// // 任务有关条件：进入正式实验指导语
// var TR_goformal_instr = {
//     type: jsPsychHtmlKeyboardResponse,
//     stimulus: function () {
//         let trials = jsPsych.data.get().filter(
//             [{ correct: true }, { correct: false }]
//         ).last(36);   //需要修改
//         let correct_trials = trials.filter({
//             correct: true
//         });
//         let accuracy = Math.round(correct_trials.count() / trials.count() * 100);
//         let rt = Math.round(correct_trials.select('rt').mean());
//         // +用于拼接字符串
//         return "<style>.context{color:white; font-size: 35px; line-height:40px}</style>\
//                           <div><p class='context'>您正确回答了" + accuracy + "% 的试次。</p >" +
//             "<p class='context'>您的平均反应时为" + rt + "毫秒。</p >" +
//             "<p class='context'>恭喜您完成练习。按任意键进入正式实验。</p >" +
//             "<p style = 'color:lightgreen; font-size: 35px;' >正式实验与练习要求相同，请您尽可能又快又准地进行按键反应</p>" +
//             "<p class='footer' style='font-size: 22px; line-height:40px;'>请将您左手和右手的<span style='color: lightgreen;'>食指</span>放在电脑键盘的相应键位上进行按键。</p >"
//     },
//     on_finish: function () {
//         $("body").css("cursor", "none");
//     }
// }
// timeline.push(TR_goformal_instr);


// // 任务有关条件：正式实验阶段（呈现带颜色的图形+标签，进行图形标签匹配任务）
// var TR_main = {
//     timeline: [
//         {   // 单个试次
//             type: jsPsychPsychophysics,
//             stimuli: [
//                 {
//                     obj_type: 'cross',   // 注视点
//                     startX: "center",
//                     startY: "center",
//                     line_length: 40, // pixels 视角：0.8° x 0.8°
//                     line_width: 5,
//                     line_color: 'white',
//                     show_start_time: 500,
//                     show_end_time: 1100   // 1100
//                 },
//                 {
//                     obj_type: "image",   // colored_shapes
//                     file: function () { return jsPsych.timelineVariable("pres_stml")() },
//                     startX: "center",
//                     startY: -200,   // 肉眼等距
//                     scale: 0.7,   // 图片缩小0.7倍
//                     width: 190,   // 调整图片大小 视角：3.8° x 3.8°
//                     heigth: 190,   // 调整图片大小 视角：3.8° x 3.8°
//                     show_start_time: 1000,
//                     show_end_time: 1100,   // 1100
//                     origin_center: true
//                 },
//                 {
//                     obj_type: 'text',
//                     file: function () { return jsPsych.timelineVariable("pres_label")() },
//                     startX: "center",
//                     startY: 140, //140，图形和文字距离 与加号等距2度
//                     content: function () {
//                         return jsPsych.timelineVariable('pres_label', true)();
//                     },
//                     font: `${80}px 'Arial'`, //字体和颜色设置 文字视角：3.6° x 1.6°
//                     text_color: 'white',
//                     show_start_time: 1000,
//                     show_end_time: 1100,   // 1100
//                     origin_center: true
//                 }
//             ],

//             choices: ['f', 'j'],
//             response_start_time: 1000,
//             trial_duration: 2500,
//             on_start: function () {
//                 console.log('呈现的标签：', jsPsych.timelineVariable('pres_label', true)());
//                 console.log('图形-标签对：', ShapeColorMap);
//                 console.log('图形配对的标签：', jsPsych.timelineVariable("paired_label", true)());
//                 console.log('正确的按键：', jsPsych.timelineVariable("identify", true)());
//             },
//             on_finish: function (data) {
//                 data.correct_response = jsPsych.timelineVariable("identify", true)();   // 正确按键
//                 data.correct = data.correct_response == data.key_press;   // 按键正确与否
//                 data.labels = jsPsych.timelineVariable('pres_label', true)();   // 呈现的标签
//                 data.shapes = jsPsych.timelineVariable("paired_label", true)();   // 图形配对的标签
//                 data.pres_colors = jsPsych.timelineVariable("pres_color", true)();   // 呈现的颜色
//                 data.paired_colors = jsPsych.timelineVariable("paired_color", true)();   // 配对的颜色
//                 data.ismatch = data.labels == data.shapes;   // 图形与标签是否匹配
//                 data.condition = "TR_main";   // 标记为正式实验阶段
//                 data.subj_idx = id
//             }
//         },
//         {   // 每个试次后反馈
//             type: jsPsychHtmlKeyboardResponse,
//             stimulus: function () {
//                 let keypress = jsPsych.data.get().last(1).values()[0].key_press; // 被试按键
//                 let time = jsPsych.data.get().last(1).values()[0].rt;
//                 let trial_correct_response = jsPsych.data.get().last(1).values()[0].correct_response;//该trial正确的按键
//                 if (time > 1500 || time === null) { //大于1500或为null为过慢
//                     return "<span class='add_' style='color:yellow; font-size: 70px;'> 太慢! </span>"
//                 } else if (time < 200) { //小于两百为过快反应
//                     return "<span style='color:yellow; font-size: 70px;'>过快! </span>"
//                 } else {
//                     if (keypress == trial_correct_response) { //如果按键 == 正确按键
//                         return "<span style='color:GreenYellow; font-size: 70px;'>正确! </span>"
//                     }
//                     else {
//                         return "<span style='color:red; font-size: 70px;'>错误! </span>"
//                     }
//                 }
//             },

//             choices: "NO_KEYS",
//             trial_duration: 300,
//             data: {
//                 screen_id: "feedback_test"
//             },
//         }
//     ],
//     timeline_variables: [
//         // 36个试次
//         // colShapes用于试次呈现；shape用于数据存储图形的身份（自我/朋友/生人）；color用于数据存储图形的颜色；labels用于试次呈现的标签；identify用于试次正确按键
//         { pres_stml: function () { return colored_shapes[0] }, pres_color: function () { return pres_colors[0] }, paired_color: function () { return paired_colors[0] }, pres_label: function () { return pres_labels[0][0] }, paired_label: function () { return paired_labels[0] }, identify: function () { return key[0] } },
//         { pres_stml: function () { return colored_shapes[0] }, pres_color: function () { return pres_colors[0] }, paired_color: function () { return paired_colors[0] }, pres_label: function () { return pres_labels[0][0] }, paired_label: function () { return paired_labels[0] }, identify: function () { return key[0] } },
//         { pres_stml: function () { return colored_shapes[0] }, pres_color: function () { return pres_colors[0] }, paired_color: function () { return paired_colors[0] }, pres_label: function () { return pres_labels[0][1] }, paired_label: function () { return paired_labels[0] }, identify: function () { return key[1] } },
//         { pres_stml: function () { return colored_shapes[0] }, pres_color: function () { return pres_colors[0] }, paired_color: function () { return paired_colors[0] }, pres_label: function () { return pres_labels[0][2] }, paired_label: function () { return paired_labels[0] }, identify: function () { return key[1] } },

//         { pres_stml: function () { return colored_shapes[1] }, pres_color: function () { return pres_colors[1] }, paired_color: function () { return paired_colors[1] }, pres_label: function () { return pres_labels[1][0] }, paired_label: function () { return paired_labels[1] }, identify: function () { return key[0] } },
//         { pres_stml: function () { return colored_shapes[1] }, pres_color: function () { return pres_colors[1] }, paired_color: function () { return paired_colors[1] }, pres_label: function () { return pres_labels[1][0] }, paired_label: function () { return paired_labels[1] }, identify: function () { return key[0] } },
//         { pres_stml: function () { return colored_shapes[1] }, pres_color: function () { return pres_colors[1] }, paired_color: function () { return paired_colors[1] }, pres_label: function () { return pres_labels[1][1] }, paired_label: function () { return paired_labels[1] }, identify: function () { return key[1] } },
//         { pres_stml: function () { return colored_shapes[1] }, pres_color: function () { return pres_colors[1] }, paired_color: function () { return paired_colors[1] }, pres_label: function () { return pres_labels[1][2] }, paired_label: function () { return paired_labels[1] }, identify: function () { return key[1] } },

//         { pres_stml: function () { return colored_shapes[2] }, pres_color: function () { return pres_colors[2] }, paired_color: function () { return paired_colors[2] }, pres_label: function () { return pres_labels[2][0] }, paired_label: function () { return paired_labels[2] }, identify: function () { return key[0] } },
//         { pres_stml: function () { return colored_shapes[2] }, pres_color: function () { return pres_colors[2] }, paired_color: function () { return paired_colors[2] }, pres_label: function () { return pres_labels[2][0] }, paired_label: function () { return paired_labels[2] }, identify: function () { return key[0] } },
//         { pres_stml: function () { return colored_shapes[2] }, pres_color: function () { return pres_colors[2] }, paired_color: function () { return paired_colors[2] }, pres_label: function () { return pres_labels[2][1] }, paired_label: function () { return paired_labels[2] }, identify: function () { return key[1] } },
//         { pres_stml: function () { return colored_shapes[2] }, pres_color: function () { return pres_colors[2] }, paired_color: function () { return paired_colors[2] }, pres_label: function () { return pres_labels[2][2] }, paired_label: function () { return paired_labels[2] }, identify: function () { return key[1] } },

//         { pres_stml: function () { return colored_shapes[3] }, pres_color: function () { return pres_colors[3] }, paired_color: function () { return paired_colors[3] }, pres_label: function () { return pres_labels[3][0] }, paired_label: function () { return paired_labels[3] }, identify: function () { return key[0] } },
//         { pres_stml: function () { return colored_shapes[3] }, pres_color: function () { return pres_colors[3] }, paired_color: function () { return paired_colors[3] }, pres_label: function () { return pres_labels[3][0] }, paired_label: function () { return paired_labels[3] }, identify: function () { return key[0] } },
//         { pres_stml: function () { return colored_shapes[3] }, pres_color: function () { return pres_colors[3] }, paired_color: function () { return paired_colors[3] }, pres_label: function () { return pres_labels[3][1] }, paired_label: function () { return paired_labels[3] }, identify: function () { return key[1] } },
//         { pres_stml: function () { return colored_shapes[3] }, pres_color: function () { return pres_colors[3] }, paired_color: function () { return paired_colors[3] }, pres_label: function () { return pres_labels[3][2] }, paired_label: function () { return paired_labels[3] }, identify: function () { return key[1] } },

//         { pres_stml: function () { return colored_shapes[4] }, pres_color: function () { return pres_colors[4] }, paired_color: function () { return paired_colors[4] }, pres_label: function () { return pres_labels[4][0] }, paired_label: function () { return paired_labels[4] }, identify: function () { return key[0] } },
//         { pres_stml: function () { return colored_shapes[4] }, pres_color: function () { return pres_colors[4] }, paired_color: function () { return paired_colors[4] }, pres_label: function () { return pres_labels[4][0] }, paired_label: function () { return paired_labels[4] }, identify: function () { return key[0] } },
//         { pres_stml: function () { return colored_shapes[4] }, pres_color: function () { return pres_colors[4] }, paired_color: function () { return paired_colors[4] }, pres_label: function () { return pres_labels[4][1] }, paired_label: function () { return paired_labels[4] }, identify: function () { return key[1] } },
//         { pres_stml: function () { return colored_shapes[4] }, pres_color: function () { return pres_colors[4] }, paired_color: function () { return paired_colors[4] }, pres_label: function () { return pres_labels[4][2] }, paired_label: function () { return paired_labels[4] }, identify: function () { return key[1] } },

//         { pres_stml: function () { return colored_shapes[5] }, pres_color: function () { return pres_colors[5] }, paired_color: function () { return paired_colors[5] }, pres_label: function () { return pres_labels[5][0] }, paired_label: function () { return paired_labels[5] }, identify: function () { return key[0] } },
//         { pres_stml: function () { return colored_shapes[5] }, pres_color: function () { return pres_colors[5] }, paired_color: function () { return paired_colors[5] }, pres_label: function () { return pres_labels[5][0] }, paired_label: function () { return paired_labels[5] }, identify: function () { return key[0] } },
//         { pres_stml: function () { return colored_shapes[5] }, pres_color: function () { return pres_colors[5] }, paired_color: function () { return paired_colors[5] }, pres_label: function () { return pres_labels[5][1] }, paired_label: function () { return paired_labels[5] }, identify: function () { return key[1] } },
//         { pres_stml: function () { return colored_shapes[5] }, pres_color: function () { return pres_colors[5] }, paired_color: function () { return paired_colors[5] }, pres_label: function () { return pres_labels[5][2] }, paired_label: function () { return paired_labels[5] }, identify: function () { return key[1] } },

//         { pres_stml: function () { return colored_shapes[6] }, pres_color: function () { return pres_colors[6] }, paired_color: function () { return paired_colors[6] }, pres_label: function () { return pres_labels[6][0] }, paired_label: function () { return paired_labels[6] }, identify: function () { return key[0] } },
//         { pres_stml: function () { return colored_shapes[6] }, pres_color: function () { return pres_colors[6] }, paired_color: function () { return paired_colors[6] }, pres_label: function () { return pres_labels[6][0] }, paired_label: function () { return paired_labels[6] }, identify: function () { return key[0] } },
//         { pres_stml: function () { return colored_shapes[6] }, pres_color: function () { return pres_colors[6] }, paired_color: function () { return paired_colors[6] }, pres_label: function () { return pres_labels[6][1] }, paired_label: function () { return paired_labels[6] }, identify: function () { return key[1] } },
//         { pres_stml: function () { return colored_shapes[6] }, pres_color: function () { return pres_colors[6] }, paired_color: function () { return paired_colors[6] }, pres_label: function () { return pres_labels[6][2] }, paired_label: function () { return paired_labels[6] }, identify: function () { return key[1] } },

//         { pres_stml: function () { return colored_shapes[7] }, pres_color: function () { return pres_colors[7] }, paired_color: function () { return paired_colors[7] }, pres_label: function () { return pres_labels[7][0] }, paired_label: function () { return paired_labels[7] }, identify: function () { return key[0] } },
//         { pres_stml: function () { return colored_shapes[7] }, pres_color: function () { return pres_colors[7] }, paired_color: function () { return paired_colors[7] }, pres_label: function () { return pres_labels[7][0] }, paired_label: function () { return paired_labels[7] }, identify: function () { return key[0] } },
//         { pres_stml: function () { return colored_shapes[7] }, pres_color: function () { return pres_colors[7] }, paired_color: function () { return paired_colors[7] }, pres_label: function () { return pres_labels[7][1] }, paired_label: function () { return paired_labels[7] }, identify: function () { return key[1] } },
//         { pres_stml: function () { return colored_shapes[7] }, pres_color: function () { return pres_colors[7] }, paired_color: function () { return paired_colors[7] }, pres_label: function () { return pres_labels[7][2] }, paired_label: function () { return paired_labels[7] }, identify: function () { return key[1] } },

//         { pres_stml: function () { return colored_shapes[8] }, pres_color: function () { return pres_colors[8] }, paired_color: function () { return paired_colors[8] }, pres_label: function () { return pres_labels[8][0] }, paired_label: function () { return paired_labels[8] }, identify: function () { return key[0] } },
//         { pres_stml: function () { return colored_shapes[8] }, pres_color: function () { return pres_colors[8] }, paired_color: function () { return paired_colors[8] }, pres_label: function () { return pres_labels[8][0] }, paired_label: function () { return paired_labels[8] }, identify: function () { return key[0] } },
//         { pres_stml: function () { return colored_shapes[8] }, pres_color: function () { return pres_colors[8] }, paired_color: function () { return paired_colors[8] }, pres_label: function () { return pres_labels[8][1] }, paired_label: function () { return paired_labels[8] }, identify: function () { return key[1] } },
//         { pres_stml: function () { return colored_shapes[8] }, pres_color: function () { return pres_colors[8] }, paired_color: function () { return paired_colors[8] }, pres_label: function () { return pres_labels[8][2] }, paired_label: function () { return paired_labels[8] }, identify: function () { return key[1] } },
//     ],
//     randomize_order: true,   //6
//     repetitions: 3,   // 3, 一个block里有108个trial; 重复n次，总试次为36n
//     on_load: () => {
//         $("body").css("cursor", "none");
//     },
//     on_finish: function () {
//         $("body").css("cursor", "default");
//     }
// }
// // 任务有关条件：阶段性反馈
// let TR_main_block_feedback = {
//     type: jsPsychHtmlKeyboardResponse,
//     stimulus: function () {
//         let trials = jsPsych.data.get().filter(
//             [{ correct: true }, { correct: false }]
//         ).last(108);// 108,填入一个block里的trial总数;
//         let correct_trials = trials.filter({
//             correct: true
//         });
//         let accuracy = Math.round(correct_trials.count() / trials.count() * 100);
//         let rt = Math.round(correct_trials.select('rt').mean());
//         return "<style>.context{color:white; font-size: 35px; line-height:40px}</style>\
//                           <div><p class='context'>您正确回答了" + accuracy + "% 的试次。</p>" +
//             "<p class='context'>您的平均反应时为" + rt + "毫秒。</p>" +
//             "<p class='context'>请按任意键进入休息</p></div>";
//     },
//     on_finish: function () {
//         $("body").css("cursor", "default"); //鼠标出现
//     }
// };
// // 休息指导语
// let TR_resid_block_numb = 4;// 此处填入总block数量-1，比如总数量是3，那么值就需要是2
// let TR_main_rest = {
//     type: jsPsychHtmlButtonResponse,
//     stimulus: function () {
//         let totaltrials = jsPsych.data.get().filter(
//             [{ correct: true }, { correct: false }]
//         );
//         return `
//                     <p>图形-标签匹配任务中，您还剩余${TR_resid_block_numb}组实验</p>
//                     <p>现在是休息时间，当您结束休息后，您可以点击 结束休息 按钮 继续</p>
//                     <p>建议休息时间还剩余<span id="iii">60</span>秒</p>`
//     },
//     choices: ["结束休息"],
//     on_load: function () {
//         $("body").css("cursor", "default");
//         let tmpTime = setInterval(function () {
//             $("#iii").text(parseInt($("#iii").text()) - 1);
//             if (parseInt($("#iii").text()) < 1) {
//                 $("#iii").parent().text("当前限定休息时间已到达，如果还未到达状态，请继续休息");
//                 clearInterval(parseInt(sessionStorage.getItem("tmpInter")));
//             }
//         }, 1000);
//         sessionStorage.setItem("tmpInter", tmpTime);
//     },
//     on_finish: function () {
//         // $("body").css("cursor", "none"); //鼠标消失
//         TR_resid_block_numb -= 1;
//         $(document.body).unbind();
//         clearInterval(parseInt(sessionStorage.getItem("tmpInter")));

//     }
// }
// // 设置重复进行block
// var TR_main_repeatblock = [
//     {
//         timeline: [TR_main, TR_main_block_feedback, TR_main_rest],
//         repetitions: 5//5
//     },
// ];
// timeline.push({
//     timeline: [{
//         timeline: TR_main_repeatblock,

//     }]
// });


// // 任务无关条件：指导语
// var TIR_instr = {
//     type: jsPsychInstructions,
//     pages: function () {
//         let start = "<p class='header' style = 'font-size: 35px'>请您记住下列图形-颜色的对应关系:</p>",
//             middle = "<p class='footer'  style = 'font-size: 35px'>如果对本实验还有不清楚之处，请立即向实验员咨询。</p>",
//             end = "<p style = 'font-size: 35px; line-height: 35px;'>如果您明白了规则：请点击 继续 </p><div>";
//         // 呈现图形--标签对应关系
//         let tmpI = "";
//         view_shape_color.forEach(v => {   //任务无关条件完成图形-颜色匹配
//             tmpI += `<p class="content" style='font-size:35px'>${v}</p>`;
//         });
//         return [
//             `<p class='header' style = 'font-size: 35px'>恭喜您完成图形-标签匹配任务！</p>
//             <p style='color:lightgreen; font-size: 35px;'>接下来您将进入颜色匹配任务</p>`,
//             start + `<div class="box">${tmpI}</div>`,
//             `<p class='footer' style='font-size: 35px; line-height: 30px;'>在颜色匹配任务中，您的任务是，</p>
//             <p class='footer' style='font-size: 35px; line-height: 30px;'>判断呈现的图形颜色是否与该图形先前匹配的颜色一致，</p>
//       <p class='footer' style='color:white; font-size: 35px;'>如果二者<span style="color: lightgreen;">一致</span>，请按键盘 <span style="color: lightgreen; font-size:35px">${key[0]}键</span></p>
//       <p class='footer' style='color:white; font-size: 35px;'>如果二者<span style="color: lightgreen;">不一致</span>，请按键盘<span style="color: lightgreen; font-size:35px"> ${key[1]}键</p></span>
//       <p class='footer' style='color:white; font-size: 22px;'>在实验过程中请将您左手与右手的<span style="color: lightgreen;">食指</span>分别放在电脑键盘的相应键位上准备按键。</p></span>`,
//             `<p style='color:white; font-size: 35px; line-height: 30px;'>接下来，您将进入颜色匹配任务的练习部分</p>
//       <p class='footer' style='color:lightgreen; font-size: 35px;'>请您又快又准地进行按键。</p>
//       <p style='color:white; font-size: 35px; line-height: 30px;'>通过练习后,您将进入正式实验。</p>
//       <p class='footer' style='color:white; font-size: 35px;'>正式实验分为5组,每组完成后会有休息时间。</p></span>`,
//             middle + end];
//     },
//     show_clickable_nav: true,
//     button_label_previous: " <span class='add_' style='color:black; font-size: 20px;'> 返回</span>",
//     button_label_next: " <span class='add_' style='color:black; font-size: 20px;'> 继续</span>",
//     // on_load: () => {
//     //     console.log('任务无关时间线变量', TIR_timeline_variables)
//     // },
// }
// timeline.push(TIR_instr);
// // 任务无关条件：练习阶段（呈现带颜色的图形+标签，进行图形标签匹配任务）
// var TIR_prac = {
//     timeline: [
//         {   // 单个试次
//             type: jsPsychPsychophysics,
//             stimuli: [
//                 {
//                     obj_type: 'cross',   // 注视点
//                     startX: "center",
//                     startY: "center",
//                     line_length: 40, // pixels 视角：0.8° x 0.8°
//                     line_width: 5,
//                     line_color: 'white',
//                     show_start_time: 500,
//                     show_end_time: 1000   // 1100
//                 },
//                 {
//                     obj_type: "image",   // colored_shapes
//                     file: function () { return jsPsych.timelineVariable("pres_stml") },
//                     startX: "center",
//                     startY: "center",
//                     scale: 0.7,   // 图片缩小0.7倍
//                     width: 190,   // 调整图片大小 视角：3.8° x 3.8°
//                     heigth: 190,   // 调整图片大小 视角：3.8° x 3.8°
//                     show_start_time: 1000,
//                     show_end_time: 1100,   // 1100
//                     origin_center: true
//                 },
//             ],
//             choices: ['f', 'j'],
//             response_start_time: 1000,
//             trial_duration: 2500,
//             on_start: function () {
//                 console.log('呈现的颜色:', jsPsych.timelineVariable('pres_color'));
//                 console.log('配对的颜色:', jsPsych.timelineVariable('paired_color'));
//                 console.log('正确按键:', jsPsych.timelineVariable('identify'));
//             },
//             on_finish: function (data) {
//                 data.correct_response = jsPsych.timelineVariable("identify");   // 正确按键
//                 data.correct = data.correct_response == data.key_press;   // 按键正确与否
//                 data.shapes = jsPsych.timelineVariable("paired_label");   // 图形配对的标签
//                 data.pres_colors = jsPsych.timelineVariable("pres_color");   // 呈现的颜色
//                 data.paired_colors = jsPsych.timelineVariable("paired_color");   // 配对的颜色
//                 data.ismatch = data.pres_colors == data.paired_colors;   // 呈现的颜色与学习的颜色是否匹配
//                 data.condition = "TIR_prac";   // 标记为练习阶段
//                 data.subj_idx = id
//             }
//         },
//         {   // 每个试次后反馈
//             type: jsPsychHtmlKeyboardResponse,
//             stimulus: function () {
//                 let keypress = jsPsych.data.get().last(1).values()[0].key_press; // 被试按键
//                 let time = jsPsych.data.get().last(1).values()[0].rt;
//                 let trial_correct_response = jsPsych.data.get().last(1).values()[0].correct_response;//该trial正确的按键
//                 if (time > 1500 || time === null) { //大于1500或为null为过慢
//                     return "<span class='add_' style='color:yellow; font-size: 70px;'> 太慢! </span>"
//                 } else if (time < 200) { //小于两百为过快反应
//                     return "<span style='color:yellow; font-size: 70px;'>过快! </span>"
//                 } else {
//                     if (keypress == trial_correct_response) { //如果按键 == 正确按键
//                         return "<span style='color:GreenYellow; font-size: 70px;'>正确! </span>"
//                     }
//                     else {
//                         return "<span style='color:red; font-size: 70px;'>错误! </span>"
//                     }
//                 }
//             },

//             choices: "NO_KEYS",
//             trial_duration: 300,
//             data: {
//                 screen_id: "feedback_test"
//             },
//         }
//     ],
//     timeline_variables: TIR_timeline_variables,   // 12个不同试次
//     randomize_order: true,   //6
//     repetitions: 3,   // 3, 需要与任务相关条件练习次数一样，必须设置成3
//     on_load: () => {
//         $("body").css("cursor", "none");
//     },
//     on_finish: function () {
//         $("body").css("cursor", "default");
//     }
// }
// // 任务无关：整个练习block反馈
// var TIR_prac_feedback = {
//     type: jsPsychHtmlKeyboardResponse,
//     stimulus: function () {
//         let trials = jsPsych.data.get().filter(
//             [{ correct: true }, { correct: false }]
//         ).last(36); //获取练习阶段所有trial数;需要修改
//         let correct_trials = trials.filter({
//             correct: true   // 获取正确的试次
//         });
//         let accuracy = Math.round(correct_trials.count() / trials.count() * 100);   //计算正确率
//         console.log('练习试次数', trials.count())
//         let rt = Math.round(correct_trials.select('rt').mean());   // 计算平均反应时
//         return `
//     <style>
//         .context { color: white; font-size: 35px; line-height: 40px; }
//     </style>
//     <div>
//         <p class='context'>您正确回答了 ${accuracy}% 的试次。</p>
//         <p class='context'>您的平均反应时为 ${rt} 毫秒。</p>
//         <p class='context'>按任意键进入下一页</p>
//     </div>
// `;
//     }
// }
// // 任务无关：再次练习指导语
// var TIR_reprac_instr = { //在这里呈现文字回顾，让被试再记一下
//     type: jsPsychInstructions,
//     pages: function () {
//         let start = "<p class='header' style='font-size:35px; line-height:30px;'>请您努力记住下列图形-颜色对应关系，并再次进行练习。</p>",
//             middle = "<p class='footer' style='font-size:35px; line-height:30px;'>如果对本实验还有不清楚之处，请立即向实验员咨询。</p>",
//             end = "<p style='font-size:35px; line-height:30px;'>如果您明白了规则：请按 继续 进入练习</p><div>";
//         let tmpI = "";
//         view_shape_color.forEach(v => {   // 任务无关条件记忆shape-color
//             tmpI += `<p class="content" style='font-size:35px'>${v}</p>`;
//         });
//         return ["<p class='header' style='font-size:35px; line-height:30px;'>您的正确率未达到进入正式实验的要求。</p>",
//             start + `<div class="box">${tmpI}</div>`,
//             `<p class='footer' style='font-size:35px; line-height:30px;'>您的任务是判断呈现的图形颜色是否与该图形先前匹配的颜色一致，</p>
//       <p class='footer' style='font-size:35px; line-height:30px;'>如果二者<span style="color: lightgreen;">一致</span>，请按键盘 <span style="color: lightgreen;">${key[0]}键</span></p>
//       <p class='footer' style='font-size:35px; line-height:30px;'>如果二者<span style="color: lightgreen;">不一致</span>，请按键盘<span style="color: lightgreen;"> ${key[1]}键</p>
//       </span><p class='footer' style='color: lightgreen; font-size:35px; line-height:30px;'>请您又快又准地进行按键。</p></span>`,
//             middle + end];
//     },
//     show_clickable_nav: true,
//     button_label_previous: " <span class='add_' style='color:black; font-size: 20px;'> 返回</span>",
//     button_label_next: " <span class='add_' style='color:black; font-size: 20px;'> 继续</span>",
//     on_finish: function () {
//         $("body").css("cursor", "none");
//     },
//     on_load: () => {
//         $("body").css("cursor", "default");
//     }
// }
// // 任务无关：判断是否需要再次练习
// var TIR_if_node = { //if_node 用于判断是否呈现feedback_matching_task_p，instruction_repractice
//     timeline: [TIR_prac_feedback, TIR_reprac_instr],
//     conditional_function: function (data) {
//         var trials = jsPsych.data.get().filter(
//             [{ correct: true }, { correct: false }]
//         ).last(36);   // 36
//         var correct_trials = trials.filter({
//             correct: true
//         });
//         var accuracy = Math.round(correct_trials.count() / trials.count() * 100);
//         if (accuracy >= acc) {   // 比较练习阶段ACC与70%的大小
//             return false;   //达标则跳过timeline,进入正式实验
//         } else if (accuracy < acc) { //没达标则进行timeline
//             return true;
//         }
//     }
// }
// // 任务无关：循环练习阶段
// var TIR_loop_node = {
//     timeline: [TIR_prac, TIR_if_node],
//     loop_function: function () {
//         var trials = jsPsych.data.get().filter(
//             [{ correct: true }, { correct: false }]
//         ).last(36);   //36
//         var correct_trials = trials.filter({
//             correct: true
//         });
//         var accuracy = Math.round(correct_trials.count() / trials.count() * 100);
//         if (accuracy >= acc) {
//             return false;   // 正确率达标，不循环，执行一次timeline
//         } else if (accuracy < acc) {    // 不达标，repeat，再执行一次timeline
//             return true;
//         }
//     }
// }
// timeline.push(TIR_loop_node);


// // 任务无关条件：进入正式实验指导语
// var TIR_goformal_instr = {
//     type: jsPsychHtmlKeyboardResponse,
//     stimulus: function () {
//         let trials = jsPsych.data.get().filter(
//             [{ correct: true }, { correct: false }]
//         ).last(36);   //需要修改
//         let correct_trials = trials.filter({
//             correct: true
//         });
//         let accuracy = Math.round(correct_trials.count() / trials.count() * 100);
//         let rt = Math.round(correct_trials.select('rt').mean());
//         // +用于拼接字符串
//         return "<style>.context{color:white; font-size: 35px; line-height:40px}</style>\
//                           <div><p class='context'>您正确回答了" + accuracy + "% 的试次。</p >" +
//             "<p class='context'>您的平均反应时为" + rt + "毫秒。</p >" +
//             "<p class='context'>恭喜您完成练习。按任意键进入颜色匹配任务正式实验。</p >" +
//             "<p style = 'color:lightgreen; font-size: 35px;' >正式实验与练习要求相同，请您尽可能又快又准地进行按键反应</p>" +
//             "<p class='footer' style='font-size: 22px; line-height:40px;'>请将您左手和右手的<span style='color: lightgreen;'>食指</span>放在电脑键盘的相应键位上进行按键。</p >"
//     },
//     on_finish: function () {
//         $("body").css("cursor", "none");
//     }
// }
// timeline.push(TIR_goformal_instr);


// // 任务无关条件：练习阶段（呈现带颜色的图形，进行颜色匹配任务）
// var TIR_main = {
//     timeline: [
//         {   // 单个试次
//             type: jsPsychPsychophysics,
//             stimuli: [
//                 {
//                     obj_type: 'cross',   // 注视点
//                     startX: "center",
//                     startY: "center",
//                     line_length: 40, // pixels 视角：0.8° x 0.8°
//                     line_width: 5,
//                     line_color: 'white',
//                     show_start_time: 500,
//                     show_end_time: 1000   // 1100
//                 },
//                 {
//                     obj_type: "image",   // colored_shapes
//                     file: function () { return jsPsych.timelineVariable("pres_stml") },
//                     startX: "center",
//                     startY: "center",
//                     scale: 0.7,   // 图片缩小0.7倍
//                     width: 190,   // 调整图片大小 视角：3.8° x 3.8°
//                     heigth: 190,   // 调整图片大小 视角：3.8° x 3.8°
//                     show_start_time: 1000,
//                     show_end_time: 1100,   // 1100
//                     origin_center: true
//                 },
//             ],
//             choices: ['f', 'j'],
//             response_start_time: 1000,
//             trial_duration: 2500,
//             on_start: function () {
//                 console.log('呈现的颜色:', jsPsych.timelineVariable('pres_color'));
//                 console.log('配对的颜色:', jsPsych.timelineVariable('paired_color'));
//                 console.log('正确按键:', jsPsych.timelineVariable('identify'));
//             },
//             on_finish: function (data) {
//                 data.correct_response = jsPsych.timelineVariable("identify");   // 正确按键
//                 data.correct = data.correct_response == data.key_press;   // 按键正确与否
//                 data.shapes = jsPsych.timelineVariable("paired_label");   // 图形配对的标签
//                 data.pres_colors = jsPsych.timelineVariable("pres_color");   // 呈现的颜色
//                 data.paired_colors = jsPsych.timelineVariable("paired_color");   // 配对的颜色
//                 data.ismatch = data.pres_colors == data.paired_colors;   // 呈现的颜色与学习的颜色是否匹配
//                 data.condition = "TIR_main";   // 标记为正式实验阶段
//                 data.subj_idx = id
//             }
//         },
//         {   // 每个试次后反馈
//             type: jsPsychHtmlKeyboardResponse,
//             stimulus: function () {
//                 let keypress = jsPsych.data.get().last(1).values()[0].key_press; // 被试按键
//                 let time = jsPsych.data.get().last(1).values()[0].rt;
//                 let trial_correct_response = jsPsych.data.get().last(1).values()[0].correct_response;//该trial正确的按键
//                 if (time > 1500 || time === null) { //大于1500或为null为过慢
//                     return "<span class='add_' style='color:yellow; font-size: 70px;'> 太慢! </span>"
//                 } else if (time < 200) { //小于两百为过快反应
//                     return "<span style='color:yellow; font-size: 70px;'>过快! </span>"
//                 } else {
//                     if (keypress == trial_correct_response) { //如果按键 == 正确按键
//                         return "<span style='color:GreenYellow; font-size: 70px;'>正确! </span>"
//                     }
//                     else {
//                         return "<span style='color:red; font-size: 70px;'>错误! </span>"
//                     }
//                 }
//             },

//             choices: "NO_KEYS",
//             trial_duration: 300,
//             data: {
//                 screen_id: "feedback_test"
//             },
//         }
//     ],
//     timeline_variables: TIR_timeline_variables,   // 12个不同试次
//     randomize_order: true,
//     repetitions: 9,   // 9, 一个block里共有108个试次
//     on_load: () => {
//         $("body").css("cursor", "none");
//     },
//     on_finish: function () {
//         $("body").css("cursor", "default");
//     }
// }
// // 任务无关条件：阶段性反馈
// let TIR_main_block_feedback = {
//     type: jsPsychHtmlKeyboardResponse,
//     stimulus: function () {
//         let trials = jsPsych.data.get().filter(
//             [{ correct: true }, { correct: false }]
//         ).last(108);// 108
//         let correct_trials = trials.filter({
//             correct: true
//         });
//         let accuracy = Math.round(correct_trials.count() / trials.count() * 100);
//         let rt = Math.round(correct_trials.select('rt').mean());
//         return "<style>.context{color:white; font-size: 35px; line-height:40px}</style>\
//                           <div><p class='context'>您正确回答了" + accuracy + "% 的试次。</p>" +
//             "<p class='context'>您的平均反应时为" + rt + "毫秒。</p>" +
//             "<p class='context'>请按任意键进入休息</p></div>";
//     },
//     on_finish: function () {
//         $("body").css("cursor", "default"); //鼠标出现
//     }
// };
// // 休息指导语
// let TIR_resid_block_numb = 4;// 此处填入总block数量-1，比如总数量是3，那么值就需要是2
// let TIR_main_rest = {
//     type: jsPsychHtmlButtonResponse,
//     stimulus: function () {
//         let totaltrials = jsPsych.data.get().filter(
//             [{ correct: true }, { correct: false }]
//         );
//         return `
//                     <p>颜色匹配任务中，您还剩余${TIR_resid_block_numb}组实验</p>
//                     <p>现在是休息时间，当您结束休息后，您可以点击 结束休息 按钮 继续</p>
//                     <p>建议休息时间还剩余<span id="iii">60</span>秒</p>`
//     },
//     choices: ["结束休息"],
//     on_load: function () {
//         $("body").css("cursor", "default");
//         let tmpTime = setInterval(function () {
//             $("#iii").text(parseInt($("#iii").text()) - 1);
//             if (parseInt($("#iii").text()) < 1) {
//                 $("#iii").parent().text("当前限定休息时间已到达，如果还未到达状态，请继续休息");
//                 clearInterval(parseInt(sessionStorage.getItem("tmpInter")));
//             }
//         }, 1000);
//         sessionStorage.setItem("tmpInter", tmpTime);
//     },
//     on_finish: function () {
//         // $("body").css("cursor", "none"); //鼠标消失
//         TIR_resid_block_numb -= 1;
//         $(document.body).unbind();
//         clearInterval(parseInt(sessionStorage.getItem("tmpInter")));
//     }
// }
// // 设置重复进行block
// var TIR_main_repeatblock = [
//     {
//         timeline: [TIR_main, TIR_main_block_feedback, TIR_main_rest],
//         repetitions: 5//5
//     },
// ];
// timeline.push({
//     timeline: [{
//         timeline: TIR_main_repeatblock,

//     }]
// });


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

