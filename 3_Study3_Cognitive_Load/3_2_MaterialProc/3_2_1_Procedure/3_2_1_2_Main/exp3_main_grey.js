
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
var shape_images = [
    '../img/circle.png',
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
var view_shape_label = []   // 存储指导语中shape-label配对
var view_shape_color = []   // 存储指导语中shape-color配对   
var ShapeColorMap = new Map();   // 存储图形-颜色对
var ShapeLabelMap = new Map();   // 存储图形-标签对


const config = {
    min_sequence: 3,   // 最小序列长度 (n + 1)
    max_sequence: 5,   // 最大序列长度
    acc: 70,   // 正确率70%才能通过练习
    rep_block: 3, // 3 重复3个block
    shape_duration: 500,  // 图形呈现时间
    label_duration: 500,  // 标签呈现时间
    response_window: 2000,  // 2000ms？反应窗口时间；从标签呈现开始计算
    feedback_duration: 500,  // 反馈持续时间
    isi: 500,   // 图形间隔

    trialsPerCondition: {  
        prac: 4,   // 4， 练习阶段，每个条件重复4次，练习试次=重复4次*4个条件=16次。一个试次7s，练习阶段2mins左右
        main: 16,   // 16，正式实验，每个条件重复16次，单个block总试次数=重复次数16*4个条件=64次；3个block，1个block每个条件重复16次，每个条件有48个试次。一个block 6分钟,一个任务18分钟，4个任务1h12mins
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

    
    // 生成单个试次，循环至单个block所有试次完成
    while (trials.length < aBlockTrials) {
        const availableConditions = allConditions.filter(c => c.count < trialsPerCondition);   // 返回未满重复次数的所有条件。
        if (availableConditions.length === 0) break;

        // 1. 确定试次的实验条件：随机选择一个实验条件
        const randomIndex = Math.floor(Math.random() * availableConditions.length);
        const condition = availableConditions[randomIndex];

        // 2. 确定试次的图形序列长度：随机生成图形序列长度
        const seqLength = Math.floor(Math.random() * (config.max_sequence - config.min_sequence + 1)) + config.min_sequence;  // 取值在3-5之间，包括首尾

        // 3. 确定目标位置
        const targetIndex = seqLength - n_back;

        // 4. 确定试次中呈现的序列图片、图片对应标签、图片对应颜色
        const shapes = [];
        const labels = [];
        const colors = [];
        const allShapes = Array.from(ShapeLabelMap.keys());  // 获取所有图形，2种

        for (let j = 0; j < seqLength; j++) {  // 根据seqLength长度指定循环次数
            // 获取目标位置图形
            if (j === targetIndex) {
                seqshape = [...ShapeLabelMap.keys()].filter(
                        key => ShapeLabelMap.get(key) === condition.label_type
                    )[0];
                 shapes.push(seqshape);
            }else {
                seqshape = allShapes[Math.floor(Math.random() * allShapes.length)];
                shapes.push(seqshape);
            }
            labels.push(ShapeLabelMap.get(seqshape));  // 获取图形对应的标签
            colors.push(ShapeColorMap.get(seqshape));  // 获取图形对应的颜色   
            }


        // 4. 目标位置的图形,对应标签/颜色
        
        const nBackShape = shapes[targetIndex];
        const nBackLabel = labels[targetIndex];
        const nBackColor = colors[targetIndex];


        // 5. 确定试次呈现的待判断标签
        let displayLabel;

        if (task === config.task.TR) {
            if (condition.is_match) {
            displayLabel = nBackLabel; // 匹配试次：显示图形对应的真实标签
        } else {
            displayLabel = config.label_types.filter(l => l !== nBackLabel)[0]; // 不匹配试次：显示其他标签
        }
        } else if (task === config.task.TIR) {
                        if (condition.is_match) {
            displayLabel = nBackColor; // 匹配试次：显示图形对应的真实标签
        } else {
            displayLabel = config.color_types.filter(l => l !== nBackColor)[0]; // 不匹配试次：显示其他标签
        }
             }

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
    trials.forEach(trial => {
        // 1. 注视点的随机时长
        const fixationDuration = getRandomTime();

        // 2. 处理图形序列的时间（控制每个图形的显示+ISI间隔）
        let currentTime = fixationDuration; // 图形从“注视点结束”后开始
        const shapeStimuli = trial.sequence.map(shape => {
            const shapeElem = {
                obj_type: "image",
                file: shape,
                startX: "center",
                startY: "center",
                width: 190,
                height: 190,
                show_start_time: currentTime,
                show_end_time: currentTime + config.shape_duration,
                origin_center: true // 中心对齐
            };
            // 下一个图形的开始时间 = 当前图形结束 + ISI间隔
            currentTime = shapeElem.show_end_time + config.isi;
            return shapeElem;
        });

        // 3. 构建当前试次的Psychophysics刺激数组（整合注视点、图形、文字）
        const trialStimuli = [
            // 注视点
            {
                obj_type: 'cross',
                startX: "center",
                startY: "center",
                line_length: 40,
                line_width: 5,
                line_color: 'white',
                show_start_time: 0,
                show_end_time: fixationDuration, // 注视点显示时长
                origin_center: true
            },
            // 图形序列
            ...shapeStimuli,
            // 文字标签
            {
                obj_type: 'text',
                content: trial.display_label,
                startX: "center",
                startY: "center",
                font: `${80}px 'Arial'`,
                text_color: 'white',
                show_start_time: currentTime, // 图形序列结束后开始显示
                show_end_time: currentTime + config.label_duration, // 文字显示时长
                origin_center: true
            }
        ];

        // 4. 加入当前试次的Psychophysics Trial
        timeline.push({
            type: jsPsychPsychophysics,
            stimuli: trialStimuli,
            choices: ['f', 'j'],
            response_ends_trial: true, // 按键后结束试次
            response_start_time: currentTime, // 开始作答时间
            trial_duration: currentTime + config.response_window, // 结束时间，一共持续2000ms
            data: {
                subj_idx: id,
                phase: trial.phase,
                stage: 'response',
                TaskRelevance: trial.task,
                CognitiveLoad: trial.n_back,
                ismatch: trial.is_match,
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
                console.log('当前试次匹配情况是', trial.is_match);
                console.log('当前试次身份是', trial.shape_meaning);
                console.log('当前试次目标处呈现图形是', trial.nBack_shape);
                console.log('呈现的标签是', trial.display_label);
                console.log('正确反应是', trial.correct_response);
            },
            on_finish: function (data) {
                data.correct_response = trial.correct_response;
                data.correct = data.correct_response == data.response;
                console.log('开始反应时间', currentTime);
                console.log('反应结束时间', currentTime + config.response_window);
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

// 2. 按被试ID随机按键
key = permutation(key, 2)[parseInt(id) % 2];// 根据ID随机按键

console.log('随ID随机的按键', key);
console.log('图形-标签配对', ShapeLabelMap);
console.log('图形-颜色配对', ShapeColorMap);


// 3. 生成试次

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






// ====================信息采集阶段==================== //
// 欢迎语
var welcome = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
        <p>您好，欢迎参加本实验。</p>
        <p>本实验由4个按键任务组成, 预计用时80分钟</p>
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
timeline.push(basic_information);


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
timeline.push(information);


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
timeline.push(chinrest)


// 进入全屏
var fullscreen_trial = {
    type: jsPsychFullscreen,
    fullscreen_mode: true,
    message: "<p><span class='add_' style='color:white; font-size: 35px;'> 实验需要全屏模式，实验期间请勿退出全屏。 </span></p >",
    button_label: " <span class='add_' style='color:black; font-size: 20px;'> 点击这里进入全屏</span>"
}
timeline.push(fullscreen_trial);



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
                 <p><span style="color: lightgreen;">您需要在标签出现时,判断该标签前的倒数第${nBack}个图形是否与当前标签匹配, </span></p>
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
                    `<p>当前任务中，屏幕中央将呈现图形序列与文字标签，</p>
                 <p><span style="color: lightgreen;">您需要在标签出现时,判断该标签前的倒数第${nBack}个图形是否与当前标签匹配,</span></p>
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

