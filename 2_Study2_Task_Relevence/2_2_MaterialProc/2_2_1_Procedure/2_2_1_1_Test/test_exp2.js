
//  初始化jsPsych对象
const jsPsych = initJsPsych({
    on_finish: function () {
        jsPsych.data.get().localSave('csv', 'exp2_' + info["ID"] + '.csv');
        document.exitFullscreen();
        let bodyNode = document.getElementsByTagName("body");
    }
});

// 不重复的排列组合函数，输入需排列的数组与个数
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

// 时间线
var timeline = []

// 形状、颜色、标签的匹配随被试ID随机；记忆顺序也需要随机（先记自我 or 朋友 or 生人）
var shape_images = [   // 指导语中呈现的刺激--无颜色的形状
    '../img/circle.png',
    '../img/square.png',
    '../img/triangle.png'
]

var color_images = [   // 指导语中呈现的刺激--颜色刷
    '../img/red.png',
    '../img/blue.png',
    '../img/green.png',
]

var colored_shapes = [   // 试次中呈现的刺激--有颜色的形状
    '../img/blue_circle.png',
    '../img/blue_square.png',
    '../img/blue_triangle.png',
    '../img/green_circle.png',
    '../img/green_square.png',
    '../img/green_triangle.png',
    '../img/red_circle.png',
    '../img/red_square.png',
    '../img/red_triangle.png',
]

var labels = ["自我", "朋友", "生人"]   // 指导语与试次中都呈现的刺激--标签
var colors = ["blue", "green", "red"]   // 标记试次中刺激的颜色
let view_texts_images = [];
var myMap = new Map();   // 存储shape_images和color_images之间的对应关系

var key = ['f', 'j']   // 被试按键
let acc = 70;   // 正确率70%才能通过练习

// 预加载实验刺激
var preload = {
    type: jsPsychPreload,
    images: [...shape_images, ...color_images, ...colored_shapes] // 合并数组
}
timeline.push(preload);
console.log("已加载", preload)


// 欢迎语
var welcome = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
     <p>您好，欢迎参加本次实验。</p>
     <p>为充分保障您的权利，请确保您已经知晓并同意《参与实验同意书》以及《数据公开知情同意书》。</p>
     <p>如果您未见过上述内容，请咨询实验员。</p>
     <p>如果您选择继续实验，则表示您已经清楚两份知情同意书的内容并同意。</p>
     <p> <div style = "color: green"><按任意键至下页></div> </p>
     `,
    choices: "ALL_KEYS",
};
timeline.push(welcome);


// 基本信息指导语
var basic_information = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
     <p>本实验首先需要您填写一些基本个人信息。</p>
     <p> <div style = "color: green"><按任意键至下页></div></p>
     `,
    choices: "ALL_KEYS",
};
timeline.push(basic_information);

// 存储被试信息：ID
var info = []

//方便测试
info["ID"] = 123;
shape_images = permutation(shape_images, 3)[parseInt(info["ID"]) % 6] // 使用被试ID随机化实验材料，将ID变为整数，使用余数作为随机图片组合的索引
color_images = permutation(color_images, 3)[parseInt(info["ID"]) % 6]
key = permutation(key, 2)[parseInt(info["ID"]) % 2]


/* basic data collection jsPsychInstructions trial 被试基本信息收集与根据ID随机化 */
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
//         {// 收集被试信息
//             type: jsPsychSurveyHtmlForm,
//             preamble: "<p style =' color : white'>您的实验编号是</p>",
//             html: function () {
//                 let data = localStorage.getItem(info["subj_idx"]) ? JSON.parse(localStorage.getItem(info["subj_idx"]))["Name"] : ""; 
//                 console.log('data的属性', Object.keys(data)); // 输出对象的所有键名
//                 // 获取被试Name属性值；三元运算符：condition ? value_if_true : value_if_false 条件为真执行?后语句，为假执行:后语句。getItem()根据键名获取键值，parse()解析为JavaScript 对象
//                 return "<p><input name='Q0' type='text' value='" + data + "' required/></p>"; // 返回name属性值；<p></p>表示段落，<input>表示输入标签，name为Q0，类型为文本输入框，值为data，具有必填属性
//             },
//             button_label: "继续",
//             on_finish: function (data) {
//                 info["ID"] = data.response.Q0;
//                 shape_images = permutation(shape_images, 3)[parseInt(info["ID"]) % 6] // 使用被试ID随机化实验材料，将ID变为整数，使用余数作为随机图片组合的索引
//                 color_images = permutation(color_images, 3)[parseInt(info["ID"]) % 6]
//                 // colored_shapes = permutation(colored_shapes, 9)
//                 colored_shapes = permutation(colored_shapes, 9)[parseInt(info["ID"]) % 6]   //使用6而不是9的阶层不影响随机化
//                 key = permutation(key, 2)[parseInt(info["ID"]) % 2]

//                 // 检查随机情况
//                 console.log("输入ID", info["ID"])
//                 console.log('随机组合的shape_images', permutation(shape_images, 3))
//                 console.log('根据ID选择的shape_images', shape_images)
//                 console.log('随机组合的color_images', permutation(color_images, 3))
//                 console.log('根据ID选择的color_images',color_images)
//                 console.log('随机组合的key', permutation(key, 2))
//                 console.log('根据ID选择的key', key)
//                 console.log('随机组合的colored_shapes', permutation(colored_shapes, 9))
//                 console.log('根据ID选择的colored_shapes', colored_shapes)


//                 // 呈现shape-label联接
//                 view_texts_images = []
//                 // 二次随机img，S-L上下位置不一样
//                 jsPsych.randomization.shuffle(images).forEach((v, i) => {// 对image进行随机化，提取出值v，索引i
//                     view_texts_images.push(`<img src="${v}" width=150 style="vertical-align:middle">---${texts[images.indexOf(v)]}`);
//                     // v---texts值写入view_texts_images；在初始image中查找v的索引，返回原始texts中该索引对应的值
//                     myMap.set(v, `${texts[images.indexOf(v)]}`);// v为键，texts输出值为值，存入myMap中
//                 }
//             )
//             }
//         },
//         {//收集性别
//             type: jsPsychHtmlButtonResponse,
//             stimulus: "<p style = 'color : white'>您的性别</p>",
//             choices: ['男', '女', '其他'],
//             on_finish: function (data) {
//                 // 若反应为0则转为Male,反应为1转为female,其他值转为other
//                 info["Sex"] = data.response == 0 ? "Male" : (data.response == 1 ? "Female" : "Other")
//             }
//         },
//         {//收集出生年
//             type: jsPsychSurveyHtmlForm,
//             preamble: "<p style = 'color : white'>您的出生年</p>",
//             html: function () {
//                 let data = localStorage.getItem(info["subj_idx"]) ? JSON.parse(localStorage.getItem(info["subj_idx"]))["BirthYear"] : "";
//                 // 提示用户输入1900~2023数值，若输入超过4位数则截取前四位
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

// 测试被试和显示器之间的距离
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

// 进入全屏
// var fullscreen_trial = {
//     type: jsPsychFullscreen,
//     fullscreen_mode: true,
//     message: "<p><span class='add_' style='color:white; font-size: 35px;'> 实验需要全屏模式，实验期间请勿退出全屏。 </span></p >",
//     button_label: " <span class='add_' style='color:black; font-size: 20px;'> 点击这里进入全屏</span>"
// }
// timeline.push(fullscreen_trial);

// 总指导语
// var Instructions = {
//     type: jsPsychInstructions,
//     pages: function () {
//         let start = "<p class='header' style = 'font-size: 35px'>请您记住如下对应关系:</p>",
//             middle = "<p class='footer'  style = 'font-size: 35px'>如果对本实验还有不清楚之处，请立即向实验员咨询。</p>",
//             end = "<p style = 'font-size: 35px; line-height: 30px;'>如果您记住了三个对应关系及按键规则，请点击 继续 </span></p><div>";
//         let tmpI = "";
//         view_texts_images.forEach(v => {
//             tmpI += `<p class="content">${v}</p>`;
//         });
//         // SOS 改！
//         return [`<p class='header' style = 'font-size: 35px'>实验说明：</p>
//             <p style='color:white; font-size: 35px;line-height: 30px;'>您好,欢迎参加本实验。本次实验大约需要45分钟完成。</p>
//             <p style='color:white; font-size: 35px;'>在本实验中，您需要完成一个知觉匹配任务与一个图形分类任务。</p>
//             <p style='color:white; font-size: 35px;'>在任务开始前，您将学习三种图形与三种标签的对应关系。</p>`,
//             start + `<div class="box">${tmpI}</div>`,
//             `<p class='footer' style='font-size: 35px; line-height: 30px;'>首先进行知觉匹配任务。</p>
//       <p class='footer' style='font-size: 35px; line-height: 30px;'>在知觉匹配任务中，您的任务是判断图形与文字标签是否匹配，</p>
//       <p class='footer' style='color:white; font-size: 35px;'>如果二者<span style="color: lightgreen;">匹配</span>，请按键盘 <span style="color: lightgreen; font-size:35px">${key[0]}</span></p>
//       <p class='footer' style='color:white; font-size: 35px;'>如果二者<span style="color: lightgreen;">不匹配</span>，请按键盘<span style="color: lightgreen; font-size:35px"> ${key[1]}</p></span>
//       <p class='footer' style='color:white; font-size: 22px;'>请在实验过程中将您右手的<span style="color: lightgreen;">食指和无名指</span>放在电脑键盘的相应键位上准备按键。</p></span>`,
//             `<p style='color:white; font-size: 35px; line-height: 30px;'>接下来，您将进入知觉匹配任务的练习部分</p>
//       <p class='footer' style='color:lightgreen; font-size: 35px;'>请您又快又准地进行按键。</p>
//       <p style='color:white; font-size: 35px; line-height: 30px;'>通过练习后,您将进入知觉匹配任务的正式试验。</p>
//       <p class='footer' style='color:white; font-size: 35px;'>正式试验分为5组,每组完成后会有休息时间。</p></span>`,
//             middle + end];
//     },
//     show_clickable_nav: true,
//     button_label_previous: " <span class='add_' style='color:black; font-size: 20px;'> 返回</span>",
//     button_label_next: " <span class='add_' style='color:black; font-size: 20px;'> 继续</span>",
//     on_load: () => {
//         $("body").css("cursor", "default");
//     },// 开始时鼠标出现
//     on_finish: function () {
//         $("body").css("cursor", "none");
//     } //结束时鼠标消失
// }
// timeline.push(Instructions);

// 知觉匹配任务：练习阶段

// Task Relevant: 呈现colored_shapes、+、labels
var TR_prac = {
    timeline: [
        {   // 单个试次
            type: jsPsychPsychophysics,
            stimuli: [
                {
                    obj_type: 'cross',   // 注视点
                    startX: "center", 
                    startY: "center",
                    line_length: 40, // pixels 视角：0.8° x 0.8°
                    line_width: 5,
                    line_color: 'white', 
                    show_start_time: 500,
                    show_end_time: 2500   // 1100
                },
                {
                    obj_type: "image",   // colored_shapes
                    file: function () { return jsPsych.timelineVariable("colShapes")() },
                    startX: "center",
                    startY: -200,   // 肉眼等距
                    scale: 0.7,   // 图片缩小0.7倍
                    width: 190,   // 调整图片大小 视角：3.8° x 3.8°
                    heigth: 190,   // 调整图片大小 视角：3.8° x 3.8°
                    show_start_time: 1000, 
                    show_end_time: 2500,   // 1100
                    origin_center: true
                },
                {
                    obj_type: 'text',
                    file: function () { return jsPsych.timelineVariable("labels")() },
                    startX: "center",
                    startY: 140, //140，图形和文字距离 与加号等距2度
                    content: function () {
                        return jsPsych.timelineVariable('labels', true)();
                    },
                    font: `${80}px 'Arial'`, //字体和颜色设置 文字视角：3.6° x 1.6°
                    text_color: 'white',
                    show_start_time: 1000, 
                    show_end_time: 2500,   // 1100
                    origin_center: true
                }
            ],

            choices: ['f', 'j'],
            response_start_time: 1000,
            trial_duration: 2500,
            on_start: function() {
                console.log('colShapes of this trial:', jsPsych.timelineVariable('colShapes'));
                console.log('shape of this trial:', jsPsych.timelineVariable('shape'));
                console.log('color of this trial:', jsPsych.timelineVariable('color'));
                console.log('labels of this trial:', jsPsych.timelineVariable('labels'));
                console.log('correct_response of this trial:', jsPsych.timelineVariable('identify'));
            },
            on_finish: function (data) {
                data.correct_response = jsPsych.timelineVariable("identify", true)();   // identify是该试次的正确答案
                data.correct = data.correct_response == data.key_press;   // 0错1对, correct是该试次正确情况
                data.labels = jsPsych.timelineVariable('labels', true)();   // word是试次中出现的标签
                data.shapes = jsPsych.timelineVariable("shape", true)();   // shape是该试次的图片含义（自我图形/朋友图形/生人图形）
                data.ismatch = data.label == data.shape;   // 图形与标签匹配情况
                data.condition = "TR_prac";   // condition: task relevant or task irrelevant
                data.association = view_texts_images;   // association是试次中出现的标签与图片的对应关系
            }
        },
        {   // 每个试次后反馈
            type: jsPsychHtmlKeyboardResponse,
            stimulus: function () {
                let keypress = jsPsych.data.get().last(1).values()[0].key_press; // 被试按键
                let time = jsPsych.data.get().last(1).values()[0].rt;
                let trial_correct_response = jsPsych.data.get().last(1).values()[0].correct_response;//该trial正确的按键
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
            trial_duration: 300,
            data: {
                screen_id: "feedback_test"
            },
        }
    ],

    timeline_variables: [
        // colored_shapes不能随被试ID随机
        { colShapes: function () { return colored_shapes[0] }, shape: function () { return labels[0] }, color: function () {return colors[0]}, labels: function () { return labels[0] }, identify: function () { return key[0] } },
        { colShapes: function () { return colored_shapes[0] }, shape: function () { return labels[0] }, color: function () {return colors[0]}, labels: function () { return labels[0] }, identify: function () { return key[0] } },
        { colShapes: function () { return colored_shapes[0] }, shape: function () { return labels[0] }, color: function () {return colors[0]}, labels: function () { return labels[1] }, identify: function () { return key[1] } },
        { colShapes: function () { return colored_shapes[0] }, shape: function () { return labels[0] }, color: function () {return colors[0]}, labels: function () { return labels[2] }, identify: function () { return key[1] } },

        { colShapes: function () { return colored_shapes[1] }, shape: function () { return labels[1] }, color: function () {return colors[0]}, labels: function () { return labels[0] }, identify: function () { return key[1] } },
        { colShapes: function () { return colored_shapes[1] }, shape: function () { return labels[1] }, color: function () {return colors[0]}, labels: function () { return labels[1] }, identify: function () { return key[0] } },
        { colShapes: function () { return colored_shapes[1] }, shape: function () { return labels[1] }, color: function () {return colors[0]}, labels: function () { return labels[1] }, identify: function () { return key[0] } },
        { colShapes: function () { return colored_shapes[1] }, shape: function () { return labels[1] }, color: function () {return colors[0]}, labels: function () { return labels[2] }, identify: function () { return key[1] } },

        { colShapes: function () { return colored_shapes[2] }, shape: function () { return labels[2] }, color: function () {return colors[0]}, labels: function () { return labels[0] }, identify: function () { return key[1] } },
        { colShapes: function () { return colored_shapes[2] }, shape: function () { return labels[2] }, color: function () {return colors[0]}, labels: function () { return labels[1] }, identify: function () { return key[1] } },
        { colShapes: function () { return colored_shapes[2] }, shape: function () { return labels[2] }, color: function () {return colors[0]}, labels: function () { return labels[2] }, identify: function () { return key[0] } },
        { colShapes: function () { return colored_shapes[2] }, shape: function () { return labels[2] }, color: function () {return colors[0]}, labels: function () { return labels[2] }, identify: function () { return key[0] } },

        { colShapes: function () { return colored_shapes[3] }, shape: function () { return labels[0] }, color: function () {return colors[1]}, labels: function () { return labels[0] }, identify: function () { return key[0] } },
        { colShapes: function () { return colored_shapes[3] }, shape: function () { return labels[0] }, color: function () {return colors[1]}, labels: function () { return labels[0] }, identify: function () { return key[0] } },
        { colShapes: function () { return colored_shapes[3] }, shape: function () { return labels[0] }, color: function () {return colors[1]}, labels: function () { return labels[1] }, identify: function () { return key[1] } },
        { colShapes: function () { return colored_shapes[3] }, shape: function () { return labels[0] }, color: function () {return colors[1]}, labels: function () { return labels[2] }, identify: function () { return key[1] } },

        { colShapes: function () { return colored_shapes[4] }, shape: function () { return labels[1] }, color: function () {return colors[1]}, labels: function () { return labels[0] }, identify: function () { return key[1] } },
        { colShapes: function () { return colored_shapes[4] }, shape: function () { return labels[1] }, color: function () {return colors[1]}, labels: function () { return labels[1] }, identify: function () { return key[0] } },
        { colShapes: function () { return colored_shapes[4] }, shape: function () { return labels[1] }, color: function () {return colors[1]}, labels: function () { return labels[1] }, identify: function () { return key[0] } },
        { colShapes: function () { return colored_shapes[4] }, shape: function () { return labels[1] }, color: function () {return colors[1]}, labels: function () { return labels[2] }, identify: function () { return key[1] } },

        { colShapes: function () { return colored_shapes[5] }, shape: function () { return labels[2] }, color: function () {return colors[1]}, labels: function () { return labels[0] }, identify: function () { return key[1] } },
        { colShapes: function () { return colored_shapes[5] }, shape: function () { return labels[2] }, color: function () {return colors[1]}, labels: function () { return labels[1] }, identify: function () { return key[1] } },
        { colShapes: function () { return colored_shapes[5] }, shape: function () { return labels[2] }, color: function () {return colors[1]}, labels: function () { return labels[2] }, identify: function () { return key[0] } },
        { colShapes: function () { return colored_shapes[5] }, shape: function () { return labels[2] }, color: function () {return colors[1]}, labels: function () { return labels[2] }, identify: function () { return key[0] } },

        { colShapes: function () { return colored_shapes[6] }, shape: function () { return labels[0] }, color: function () {return colors[2]}, labels: function () { return labels[0] }, identify: function () { return key[0] } },
        { colShapes: function () { return colored_shapes[6] }, shape: function () { return labels[0] }, color: function () {return colors[2]}, labels: function () { return labels[0] }, identify: function () { return key[0] } },
        { colShapes: function () { return colored_shapes[6] }, shape: function () { return labels[0] }, color: function () {return colors[2]}, labels: function () { return labels[1] }, identify: function () { return key[1] } },
        { colShapes: function () { return colored_shapes[6] }, shape: function () { return labels[0] }, color: function () {return colors[2]}, labels: function () { return labels[2] }, identify: function () { return key[1] } },

        { colShapes: function () { return colored_shapes[7] }, shape: function () { return labels[1] }, color: function () {return colors[2]}, labels: function () { return labels[0] }, identify: function () { return key[1] } },
        { colShapes: function () { return colored_shapes[7] }, shape: function () { return labels[1] }, color: function () {return colors[2]}, labels: function () { return labels[1] }, identify: function () { return key[0] } },
        { colShapes: function () { return colored_shapes[7] }, shape: function () { return labels[1] }, color: function () {return colors[2]}, labels: function () { return labels[1] }, identify: function () { return key[0] } },
        { colShapes: function () { return colored_shapes[7] }, shape: function () { return labels[1] }, color: function () {return colors[2]}, labels: function () { return labels[2] }, identify: function () { return key[1] } },

        { colShapes: function () { return colored_shapes[8] }, shape: function () { return labels[2] }, color: function () {return colors[2]}, labels: function () { return labels[0] }, identify: function () { return key[1] } },
        { colShapes: function () { return colored_shapes[8] }, shape: function () { return labels[2] }, color: function () {return colors[2]}, labels: function () { return labels[1] }, identify: function () { return key[1] } },
        { colShapes: function () { return colored_shapes[8] }, shape: function () { return labels[2] }, color: function () {return colors[2]}, labels: function () { return labels[2] }, identify: function () { return key[0] } },
        { colShapes: function () { return colored_shapes[8] }, shape: function () { return labels[2] }, color: function () {return colors[2]}, labels: function () { return labels[2] }, identify: function () { return key[0] } },
    ],
    randomize_order: true,
    repetitions: 1,   // 练习重复1次，练习试次36个
    on_load: () => {
        $("body").css("cursor", "none");
    },
    on_finish: function () {
         $("body").css("cursor", "default"); 
    }
}

// // timeline.push(TR_prac);

// // 任务相关练习阶段结束后反馈
// var feedback_block_prac = {
//     type: jsPsychHtmlKeyboardResponse,
//     stimulus: function () {
//         let trials = jsPsych.data.get().filter(
//             [{ correct: true }, { correct: false }]
//         ).last(36); //这里填入prac所有trial数
//         let correct_trials = trials.filter({
//             correct: true
//         });
//         let accuracy = Math.round(correct_trials.count() / trials.count() * 100);
//         let rt = Math.round(correct_trials.select('rt').mean());
//         return "<style>.context{color:white; font-size: 35px; line-height:40px}</style>\
//                           <div><p class='context'>您正确回答了" + accuracy + "% 的试次。</p >" +
//             "<p class='context'>您的平均反应时为" + rt + "毫秒。</p >";
//     }
// }
// // 任务相关再次练习 指导语
// var instr_repractice = { //在这里呈现文字回顾，让被试再记一下
//     type: jsPsychInstructions,
//     pages: function () {
//         let start = "<p class='header' style='font-size:35px; line-height:30px;'>请您努力记下如下匹配对应关系，并再次进行练习。</p>",
//             middle = "<p class='footer' style='font-size:35px; line-height:30px;'>如果对本实验还有不清楚之处，请立即向实验员咨询。</p>",
//             end = "<p style='font-size:35px; line-height:30px;'>如果您明白了规则：</p><p style='font-size:35px; line-height:30px;'>请按 继续 进入练习</p><div>";
//         let tmpI = "";
//         view_texts_images.forEach(v => {
//             tmpI += `<p class="content" style='font-size:35px'>${v}</p>`;
//         });
//         return ["<p class='header' style='font-size:35px; line-height:30px;'>您的正确率未达到进入正式实验的要求。</p>",
//             start + `<div class="box">${tmpI}</div>`,
//             `<p class='footer' style='font-size:35px; line-height:30px;'>您的任务是判断图形与文字标签是否匹配，</p>
//       <p class='footer' style='font-size:35px; line-height:30px;'>如果二者<span style="color: lightgreen;">匹配</span>，请按键盘 <span style="color: lightgreen;">${key[0]}</span></p>
//       <p class='footer' style='font-size:35px; line-height:30px;'>如果二者<span style="color: lightgreen;">不匹配</span>，请按键盘<span style="color: lightgreen;"> ${key[1]}</p>
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
// var if_node = { //if_node 用于判断是否呈现feedback_matching_task_p，instruction_repractice
//     timeline: [feedback_block_prac, instr_repractice],
//     conditional_function: function (data) {
//         var trials = jsPsych.data.get().filter(
//             [{ correct: true }, { correct: false }]
//         ).last(36);//这里注意：只需要上一组的练习数据，而不是所有的数据！！ 
//         var correct_trials = trials.filter({
//             correct: true
//         });
//         var accuracy = Math.round(correct_trials.count() / trials.count() * 100);
//         if (accuracy >= acc) {
//             return false;//达标skip掉if_node3
//         } else if (accuracy < acc) { //没达标则输出需要再次练习的指导语
//             return true;
//         }
//     }
// }
// // 任务相关：循环练习阶段
// var loop_node = {
//     timeline: [TR_prac, if_node],
//     loop_function: function () {
//         var trials = jsPsych.data.get().filter(
//             [{ correct: true }, { correct: false }]
//         ).last(36);//填练习阶段所有trial数
//         var correct_trials = trials.filter({
//             correct: true
//         });
//         var accuracy = Math.round(correct_trials.count() / trials.count() * 100);
//         if (accuracy >= acc) {
//             return false;// 正确率达标，跳过练习循环
//         } else if (accuracy < acc) { // 不达标，repeat
//             return true;
//         }
//     }
// }

// // 将练习加入timeline
// timeline.push(loop_node);

// // 知觉匹配任务：进入正式实验指导语
// var feedback_goformal_matching = {
//     type: jsPsychHtmlKeyboardResponse,
//     stimulus: function () {
//         let trials = jsPsych.data.get().filter(
//             [{ correct: true }, { correct: false }]
//         ).last(12);
//         let correct_trials = trials.filter({
//             correct: true
//         });
//         let accuracy = Math.round(correct_trials.count() / trials.count() * 100);
//         let rt = Math.round(correct_trials.select('rt').mean());
//         // +用于拼接字符串
//         return "<style>.context{color:white; font-size: 35px; line-height:40px}</style>\
//                           <div><p class='context'>您正确回答了" + accuracy + "% 的试次。</p >" +
//             "<p class='context'>您的平均反应时为" + rt + "毫秒。</p >" +
//             "<p class='context'>恭喜您完成练习。按任意键进入知觉匹配任务正式实验。</p >" +
//             "<p style = 'color:lightgreen; font-size: 35px;' >正式实验与练习要求相同，请您尽可能又快又准地进行按键反应</p>" +
//             "<p class='footer' style='font-size: 22px; line-height:40px;'>请将您右手的<span style='color: lightgreen;'>食指与无名指</span>放在电脑键盘的相应键位上进行按键。</p >"
//     },
//     on_finish: function () {
//         $("body").css("cursor", "none");
//     }
// }
// timeline.push(feedback_goformal_matching);

// // // 任务相关：正式实验
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
//                     show_end_time: 2500   // 1100
//                 },
//                 {
//                     obj_type: "image",   // colored_shapes
//                     file: function () { return jsPsych.timelineVariable("colShapes")() },
//                     startX: "center",
//                     startY: -200,   // 肉眼等距
//                     scale: 0.7,   // 图片缩小0.7倍
//                     width: 190,   // 调整图片大小 视角：3.8° x 3.8°
//                     heigth: 190,   // 调整图片大小 视角：3.8° x 3.8°
//                     show_start_time: 1000, 
//                     show_end_time: 2500,   // 1100
//                     origin_center: true
//                 },
//                 {
//                     obj_type: 'text',
//                     file: function () { return jsPsych.timelineVariable("labels")() },
//                     startX: "center",
//                     startY: 140, //140，图形和文字距离 与加号等距2度
//                     content: function () {
//                         return jsPsych.timelineVariable('labels', true)();
//                     },
//                     font: `${80}px 'Arial'`, //字体和颜色设置 文字视角：3.6° x 1.6°
//                     text_color: 'white',
//                     show_start_time: 1000, 
//                     show_end_time: 2500,   // 1100
//                     origin_center: true
//                 }
//             ],

//             choices: ['f', 'j'],
//             response_start_time: 1000,
//             trial_duration: 2500,
//             on_start: function() {
//                 console.log('colShapes of this trial:', jsPsych.timelineVariable('colShapes'));
//                 console.log('shape of this trial:', jsPsych.timelineVariable('shape'));
//                 console.log('color of this trial:', jsPsych.timelineVariable('color'));
//                 console.log('labels of this trial:', jsPsych.timelineVariable('labels'));
//                 console.log('correct_response of this trial:', jsPsych.timelineVariable('identify'));
//             },
//             on_finish: function (data) {
//                 data.correct_response = jsPsych.timelineVariable("identify", true)();   // identify是该试次的正确答案
//                 data.correct = data.correct_response == data.key_press;   // 0错1对, correct是该试次正确情况
//                 data.labels = jsPsych.timelineVariable('labels', true)();   // word是试次中出现的标签
//                 data.shapes = jsPsych.timelineVariable("shape", true)();   // shape是该试次的图片含义（自我图形/朋友图形/生人图形）
//                 data.ismatch = data.label == data.shape;   // 图形与标签匹配情况
//                 data.condition = "TR_prac";   // condition: task relevant or task irrelevant
//                 data.association = view_texts_images;   // association是试次中出现的标签与图片的对应关系
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
//         // colored_shapes不能随被试ID随机
//         { colShapes: function () { return colored_shapes[0] }, shape: function () { return labels[0] }, color: function () {return colors[0]}, labels: function () { return labels[0] }, identify: function () { return key[0] } },
//         { colShapes: function () { return colored_shapes[0] }, shape: function () { return labels[0] }, color: function () {return colors[0]}, labels: function () { return labels[0] }, identify: function () { return key[0] } },
//         { colShapes: function () { return colored_shapes[0] }, shape: function () { return labels[0] }, color: function () {return colors[0]}, labels: function () { return labels[1] }, identify: function () { return key[1] } },
//         { colShapes: function () { return colored_shapes[0] }, shape: function () { return labels[0] }, color: function () {return colors[0]}, labels: function () { return labels[2] }, identify: function () { return key[1] } },

//         { colShapes: function () { return colored_shapes[1] }, shape: function () { return labels[1] }, color: function () {return colors[0]}, labels: function () { return labels[0] }, identify: function () { return key[1] } },
//         { colShapes: function () { return colored_shapes[1] }, shape: function () { return labels[1] }, color: function () {return colors[0]}, labels: function () { return labels[1] }, identify: function () { return key[0] } },
//         { colShapes: function () { return colored_shapes[1] }, shape: function () { return labels[1] }, color: function () {return colors[0]}, labels: function () { return labels[1] }, identify: function () { return key[0] } },
//         { colShapes: function () { return colored_shapes[1] }, shape: function () { return labels[1] }, color: function () {return colors[0]}, labels: function () { return labels[2] }, identify: function () { return key[1] } },

//         { colShapes: function () { return colored_shapes[2] }, shape: function () { return labels[2] }, color: function () {return colors[0]}, labels: function () { return labels[0] }, identify: function () { return key[1] } },
//         { colShapes: function () { return colored_shapes[2] }, shape: function () { return labels[2] }, color: function () {return colors[0]}, labels: function () { return labels[1] }, identify: function () { return key[1] } },
//         { colShapes: function () { return colored_shapes[2] }, shape: function () { return labels[2] }, color: function () {return colors[0]}, labels: function () { return labels[2] }, identify: function () { return key[0] } },
//         { colShapes: function () { return colored_shapes[2] }, shape: function () { return labels[2] }, color: function () {return colors[0]}, labels: function () { return labels[2] }, identify: function () { return key[0] } },

//         { colShapes: function () { return colored_shapes[3] }, shape: function () { return labels[0] }, color: function () {return colors[1]}, labels: function () { return labels[0] }, identify: function () { return key[0] } },
//         { colShapes: function () { return colored_shapes[3] }, shape: function () { return labels[0] }, color: function () {return colors[1]}, labels: function () { return labels[0] }, identify: function () { return key[0] } },
//         { colShapes: function () { return colored_shapes[3] }, shape: function () { return labels[0] }, color: function () {return colors[1]}, labels: function () { return labels[1] }, identify: function () { return key[1] } },
//         { colShapes: function () { return colored_shapes[3] }, shape: function () { return labels[0] }, color: function () {return colors[1]}, labels: function () { return labels[2] }, identify: function () { return key[1] } },

//         { colShapes: function () { return colored_shapes[4] }, shape: function () { return labels[1] }, color: function () {return colors[1]}, labels: function () { return labels[0] }, identify: function () { return key[1] } },
//         { colShapes: function () { return colored_shapes[4] }, shape: function () { return labels[1] }, color: function () {return colors[1]}, labels: function () { return labels[1] }, identify: function () { return key[0] } },
//         { colShapes: function () { return colored_shapes[4] }, shape: function () { return labels[1] }, color: function () {return colors[1]}, labels: function () { return labels[1] }, identify: function () { return key[0] } },
//         { colShapes: function () { return colored_shapes[4] }, shape: function () { return labels[1] }, color: function () {return colors[1]}, labels: function () { return labels[2] }, identify: function () { return key[1] } },

//         { colShapes: function () { return colored_shapes[5] }, shape: function () { return labels[2] }, color: function () {return colors[1]}, labels: function () { return labels[0] }, identify: function () { return key[1] } },
//         { colShapes: function () { return colored_shapes[5] }, shape: function () { return labels[2] }, color: function () {return colors[1]}, labels: function () { return labels[1] }, identify: function () { return key[1] } },
//         { colShapes: function () { return colored_shapes[5] }, shape: function () { return labels[2] }, color: function () {return colors[1]}, labels: function () { return labels[2] }, identify: function () { return key[0] } },
//         { colShapes: function () { return colored_shapes[5] }, shape: function () { return labels[2] }, color: function () {return colors[1]}, labels: function () { return labels[2] }, identify: function () { return key[0] } },

//         { colShapes: function () { return colored_shapes[6] }, shape: function () { return labels[0] }, color: function () {return colors[2]}, labels: function () { return labels[0] }, identify: function () { return key[0] } },
//         { colShapes: function () { return colored_shapes[6] }, shape: function () { return labels[0] }, color: function () {return colors[2]}, labels: function () { return labels[0] }, identify: function () { return key[0] } },
//         { colShapes: function () { return colored_shapes[6] }, shape: function () { return labels[0] }, color: function () {return colors[2]}, labels: function () { return labels[1] }, identify: function () { return key[1] } },
//         { colShapes: function () { return colored_shapes[6] }, shape: function () { return labels[0] }, color: function () {return colors[2]}, labels: function () { return labels[2] }, identify: function () { return key[1] } },

//         { colShapes: function () { return colored_shapes[7] }, shape: function () { return labels[1] }, color: function () {return colors[2]}, labels: function () { return labels[0] }, identify: function () { return key[1] } },
//         { colShapes: function () { return colored_shapes[7] }, shape: function () { return labels[1] }, color: function () {return colors[2]}, labels: function () { return labels[1] }, identify: function () { return key[0] } },
//         { colShapes: function () { return colored_shapes[7] }, shape: function () { return labels[1] }, color: function () {return colors[2]}, labels: function () { return labels[1] }, identify: function () { return key[0] } },
//         { colShapes: function () { return colored_shapes[7] }, shape: function () { return labels[1] }, color: function () {return colors[2]}, labels: function () { return labels[2] }, identify: function () { return key[1] } },

//         { colShapes: function () { return colored_shapes[8] }, shape: function () { return labels[2] }, color: function () {return colors[2]}, labels: function () { return labels[0] }, identify: function () { return key[1] } },
//         { colShapes: function () { return colored_shapes[8] }, shape: function () { return labels[2] }, color: function () {return colors[2]}, labels: function () { return labels[1] }, identify: function () { return key[1] } },
//         { colShapes: function () { return colored_shapes[8] }, shape: function () { return labels[2] }, color: function () {return colors[2]}, labels: function () { return labels[2] }, identify: function () { return key[0] } },
//         { colShapes: function () { return colored_shapes[8] }, shape: function () { return labels[2] }, color: function () {return colors[2]}, labels: function () { return labels[2] }, identify: function () { return key[0] } },
//     ],
//     randomize_order: true,
//     repetitions: 1,   // 练习重复1次，练习试次36个
//     on_load: () => {
//         $("body").css("cursor", "none");
//     },
//     on_finish: function () {
//          $("body").css("cursor", "default"); 
//     }
// }

// // block结束后反馈
// let feedback_block_TR_main = {
//     type: jsPsychHtmlKeyboardResponse,
//     stimulus: function () {
//         let trials = jsPsych.data.get().filter(
//             [{ correct: true }, { correct: false }]
//         ).last(36);// 36;last()填入一个block里的trial总数;
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

// // // 休息指导语
// let blockTotalNum_same = 1;// 此处填入总block数量-1，比如总数量是3，那么值就需要是2
// let rest_TR_main = {
//     type: jsPsychHtmlButtonResponse,
//     stimulus: function () {
//         let totaltrials = jsPsych.data.get().filter(
//             [{ correct: true }, { correct: false }]
//         );
//         return `
//                     <p>图形-标签匹配任务中，您还剩余${blockTotalNum_same}组实验</p>
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
//         blockTotalNum_same -= 1;
//         $(document.body).unbind();
//         clearInterval(parseInt(sessionStorage.getItem("tmpInter")));
//     }
// }

// // 设置重复进行block
// var repeatblock_TR_main = [
//     {
//         timeline: [TR_main, feedback_block_TR_main, rest_TR_main],
//         repetitions: 1//5
//     },

// ];

// timeline.push({
//     timeline: [{
//         timeline: repeatblock_TR_main,

//     }]
// });


// /* 任务无关条件：图形-颜色匹配任务 */

var TIR_prac = {
    timeline: [
        {   // 单个试次
            type: jsPsychPsychophysics,
            stimuli: [
                {
                    obj_type: 'cross',   // 注视点
                    startX: "center", 
                    startY: "center",
                    line_length: 40, // pixels 视角：0.8° x 0.8°
                    line_width: 5,
                    line_color: 'white', 
                    show_start_time: 500,
                    show_end_time: 2500   // 1100
                },
                {
                    obj_type: "image",   // colored_shapes
                    file: function () { return jsPsych.timelineVariable("colShapes")() },
                    startX: "center",
                    startY: "center",   // 肉眼等距
                    scale: 0.7,   // 图片缩小0.7倍
                    width: 190,   // 调整图片大小 视角：3.8° x 3.8°
                    heigth: 190,   // 调整图片大小 视角：3.8° x 3.8°
                    show_start_time: 1000, 
                    show_end_time: 2500,   // 1100
                    origin_center: true
                }
            ],

            choices: ['f', 'j'],
            response_start_time: 1000,
            trial_duration: 2500,
            on_start: function() {
                console.log('colShapes of this trial:', jsPsych.timelineVariable('colShapes'));
                console.log('shape of this trial:', jsPsych.timelineVariable('shape'));
                console.log('color of this trial:', jsPsych.timelineVariable('color'));
                console.log('labels of this trial:', jsPsych.timelineVariable('labels'));
                console.log('correct_response of this trial:', jsPsych.timelineVariable('identify'));
            },
            on_finish: function (data) {
                data.correct_response = jsPsych.timelineVariable("identify", true)();   // identify是该试次的正确答案
                data.correct = data.correct_response == data.key_press;   // 0错1对, correct是该试次正确情况
                data.shapes = jsPsych.timelineVariable("shape", true)();   // shape是该试次的图片含义（自我图形/朋友图形/生人图形）
                // data.ismatch = data.colors == data.shape;   // 图形与标签匹配情况
                data.condition = "TIR_prac";   // condition: task relevant or task irrelevant
                data.association = view_texts_images;   // association是试次中出现的标签与图片的对应关系
            }
        },
        {   // 每个试次后反馈
            type: jsPsychHtmlKeyboardResponse,
            stimulus: function () {
                let keypress = jsPsych.data.get().last(1).values()[0].key_press; // 被试按键
                let time = jsPsych.data.get().last(1).values()[0].rt;
                let trial_correct_response = jsPsych.data.get().last(1).values()[0].correct_response;//该trial正确的按键
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
            trial_duration: 300,
            data: {
                screen_id: "feedback_test"
            },
        }
    ],

    timeline_variables: [
        // colored_shapes不能随被试ID随机
        { colShapes: function () { return colored_shapes[0] }, shape: function () { return labels[0] }, color: function () {return colors[0]}, labels: function () { return labels[0] }, identify: function () { return key[0] } },
        { colShapes: function () { return colored_shapes[0] }, shape: function () { return labels[0] }, color: function () {return colors[0]}, labels: function () { return labels[0] }, identify: function () { return key[0] } },
        { colShapes: function () { return colored_shapes[0] }, shape: function () { return labels[0] }, color: function () {return colors[0]}, labels: function () { return labels[1] }, identify: function () { return key[1] } },
        { colShapes: function () { return colored_shapes[0] }, shape: function () { return labels[0] }, color: function () {return colors[0]}, labels: function () { return labels[2] }, identify: function () { return key[1] } },

        { colShapes: function () { return colored_shapes[1] }, shape: function () { return labels[1] }, color: function () {return colors[0]}, labels: function () { return labels[0] }, identify: function () { return key[1] } },
        { colShapes: function () { return colored_shapes[1] }, shape: function () { return labels[1] }, color: function () {return colors[0]}, labels: function () { return labels[1] }, identify: function () { return key[0] } },
        { colShapes: function () { return colored_shapes[1] }, shape: function () { return labels[1] }, color: function () {return colors[0]}, labels: function () { return labels[1] }, identify: function () { return key[0] } },
        { colShapes: function () { return colored_shapes[1] }, shape: function () { return labels[1] }, color: function () {return colors[0]}, labels: function () { return labels[2] }, identify: function () { return key[1] } },

        { colShapes: function () { return colored_shapes[2] }, shape: function () { return labels[2] }, color: function () {return colors[0]}, labels: function () { return labels[0] }, identify: function () { return key[1] } },
        { colShapes: function () { return colored_shapes[2] }, shape: function () { return labels[2] }, color: function () {return colors[0]}, labels: function () { return labels[1] }, identify: function () { return key[1] } },
        { colShapes: function () { return colored_shapes[2] }, shape: function () { return labels[2] }, color: function () {return colors[0]}, labels: function () { return labels[2] }, identify: function () { return key[0] } },
        { colShapes: function () { return colored_shapes[2] }, shape: function () { return labels[2] }, color: function () {return colors[0]}, labels: function () { return labels[2] }, identify: function () { return key[0] } },

        { colShapes: function () { return colored_shapes[3] }, shape: function () { return labels[0] }, color: function () {return colors[1]}, labels: function () { return labels[0] }, identify: function () { return key[0] } },
        { colShapes: function () { return colored_shapes[3] }, shape: function () { return labels[0] }, color: function () {return colors[1]}, labels: function () { return labels[0] }, identify: function () { return key[0] } },
        { colShapes: function () { return colored_shapes[3] }, shape: function () { return labels[0] }, color: function () {return colors[1]}, labels: function () { return labels[1] }, identify: function () { return key[1] } },
        { colShapes: function () { return colored_shapes[3] }, shape: function () { return labels[0] }, color: function () {return colors[1]}, labels: function () { return labels[2] }, identify: function () { return key[1] } },

        { colShapes: function () { return colored_shapes[4] }, shape: function () { return labels[1] }, color: function () {return colors[1]}, labels: function () { return labels[0] }, identify: function () { return key[1] } },
        { colShapes: function () { return colored_shapes[4] }, shape: function () { return labels[1] }, color: function () {return colors[1]}, labels: function () { return labels[1] }, identify: function () { return key[0] } },
        { colShapes: function () { return colored_shapes[4] }, shape: function () { return labels[1] }, color: function () {return colors[1]}, labels: function () { return labels[1] }, identify: function () { return key[0] } },
        { colShapes: function () { return colored_shapes[4] }, shape: function () { return labels[1] }, color: function () {return colors[1]}, labels: function () { return labels[2] }, identify: function () { return key[1] } },

        { colShapes: function () { return colored_shapes[5] }, shape: function () { return labels[2] }, color: function () {return colors[1]}, labels: function () { return labels[0] }, identify: function () { return key[1] } },
        { colShapes: function () { return colored_shapes[5] }, shape: function () { return labels[2] }, color: function () {return colors[1]}, labels: function () { return labels[1] }, identify: function () { return key[1] } },
        { colShapes: function () { return colored_shapes[5] }, shape: function () { return labels[2] }, color: function () {return colors[1]}, labels: function () { return labels[2] }, identify: function () { return key[0] } },
        { colShapes: function () { return colored_shapes[5] }, shape: function () { return labels[2] }, color: function () {return colors[1]}, labels: function () { return labels[2] }, identify: function () { return key[0] } },

        { colShapes: function () { return colored_shapes[6] }, shape: function () { return labels[0] }, color: function () {return colors[2]}, labels: function () { return labels[0] }, identify: function () { return key[0] } },
        { colShapes: function () { return colored_shapes[6] }, shape: function () { return labels[0] }, color: function () {return colors[2]}, labels: function () { return labels[0] }, identify: function () { return key[0] } },
        { colShapes: function () { return colored_shapes[6] }, shape: function () { return labels[0] }, color: function () {return colors[2]}, labels: function () { return labels[1] }, identify: function () { return key[1] } },
        { colShapes: function () { return colored_shapes[6] }, shape: function () { return labels[0] }, color: function () {return colors[2]}, labels: function () { return labels[2] }, identify: function () { return key[1] } },

        { colShapes: function () { return colored_shapes[7] }, shape: function () { return labels[1] }, color: function () {return colors[2]}, labels: function () { return labels[0] }, identify: function () { return key[1] } },
        { colShapes: function () { return colored_shapes[7] }, shape: function () { return labels[1] }, color: function () {return colors[2]}, labels: function () { return labels[1] }, identify: function () { return key[0] } },
        { colShapes: function () { return colored_shapes[7] }, shape: function () { return labels[1] }, color: function () {return colors[2]}, labels: function () { return labels[1] }, identify: function () { return key[0] } },
        { colShapes: function () { return colored_shapes[7] }, shape: function () { return labels[1] }, color: function () {return colors[2]}, labels: function () { return labels[2] }, identify: function () { return key[1] } },

        { colShapes: function () { return colored_shapes[8] }, shape: function () { return labels[2] }, color: function () {return colors[2]}, labels: function () { return labels[0] }, identify: function () { return key[1] } },
        { colShapes: function () { return colored_shapes[8] }, shape: function () { return labels[2] }, color: function () {return colors[2]}, labels: function () { return labels[1] }, identify: function () { return key[1] } },
        { colShapes: function () { return colored_shapes[8] }, shape: function () { return labels[2] }, color: function () {return colors[2]}, labels: function () { return labels[2] }, identify: function () { return key[0] } },
        { colShapes: function () { return colored_shapes[8] }, shape: function () { return labels[2] }, color: function () {return colors[2]}, labels: function () { return labels[2] }, identify: function () { return key[0] } },
    ],
    randomize_order: true,
    repetitions: 1,   // 练习重复1次，练习试次36个
    on_load: () => {
        $("body").css("cursor", "none");
    },
    on_finish: function () {
         $("body").css("cursor", "default"); 
    }
}

// /* 实验结束语 */
// var finish = {
//     type: jsPsychHtmlKeyboardResponse,
//     stimulus: `
//         <p>感谢您参加我们的实验，请<span style="color: yellow;">按任意键开始下载数据</span>，并通知实验员。</p>
//         <p>感谢您的配合！</p>`,
//     choices: "ALL_KEYS",
// };
// timeline.push(finish);


jsPsych.run(timeline);

