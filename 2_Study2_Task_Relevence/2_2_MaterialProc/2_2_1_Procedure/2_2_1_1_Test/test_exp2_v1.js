
//  初始化jsPsych对象
const jsPsych = initJsPsych({
    on_finish: function () {
        jsPsych.data.get().localSave('csv', 'exp2_' + info["ID"] + '.csv');
        document.exitFullscreen();
        let bodyNode = document.getElementsByTagName("body");
    }
});

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

// 预加载实验刺激
var preload = {
    type: jsPsychPreload,
    images: [...shape_images, ...color_images, ...colored_shapes] // 合并数组
}
timeline.push(preload);
console.log("已加载", preload)



/* 函数 */

// 不重复的排列组合函数，输入需排列的数组与个数，输出所有的排列组合
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

function generateCombinations(color_images, shape_images, labels) {
    const colorPermutations = permutation(color_images, 3);
    const shapePermutations = permutation(shape_images, 3);
    const results = [];   // 存储颜色-形状-标签配对，图片+文本
    const cmbs = [];      // 存储颜色-形状-标签配对，纯文本，用于检查

    for (let colorPerm of colorPermutations) {
        for (let shapePerm of shapePermutations) {
            const combination = []; // 创建一个数组来存储当前的完整组合
            const cmb = [];
            for (let i = 0; i < 3; i++) {
                combination.push(`<img src="${colorPerm[i]}" width=120 style="vertical-align: middle;"><span style="font-size: 25px;">-----</span><img src="${shapePerm[i]}" width=120 style="vertical-align: middle; margin-right: 60px;"><span style="position: relative; right: 60px; font-size: 25px;">-----&nbsp;${labels[i]}</span>`); 
                cmb.push([colorPerm[i], shapePerm[i], labels[i]]);
            }
            results.push(combination); // 将完整的组合添加到结果数组中
            cmbs.push(cmb); 
        }
    }

    return { results, cmbs };
}

// 函数：从单个图片路径中提取颜色和形状
function extractColorAndShape(imagePath) {   // 输入试次中呈现的单个图片路径；格式为：'../img/blue_circle.png'
    const parts = imagePath.split('_');
    const stml_color = parts[0].split('/').pop(); // 提取颜色部分
    const stml_shape = parts[1].split('.')[0]; // 提取形状部分
    return { stml_color, stml_shape };
}

// 函数：根据刺激形状找到该形状配对的标签和颜色
function getLabelAndColorByShape(stml_shape) {
    for (let i = 0; i < combo_text.length; i++) {
        const [colorPath, shapePath, combo_label] = combo_text[i];
        if (shapePath === `../img/${stml_shape}.png`) {
            const combo_color = colorPath.split('/').pop().replace('.png', '');
            return { combo_color, combo_label };
        }
    }
    return null; // 如果没有找到匹配项，返回 null
}

// 函数：生成试次中呈现的标签(trial_label)，用于平衡匹配不匹配试次
function generateTrialLabels(colored_shapes) {
    const trial_labels = [];
    // const trial_colors = [];
    stml_Labels = [];
    stml_colors = [];

    colored_shapes.forEach(imagePath => {
        const { stml_color, stml_shape } = extractColorAndShape(imagePath);
        const { combo_color, combo_label } = getLabelAndColorByShape(stml_shape);
        stml_colors.push(stml_color);   // 存储所有刺激当前的颜色
        stml_Labels.push(combo_label);   // 存储所有刺激形状配对的标签

        console.log('当前刺激的颜色', stml_color);   // 调试
        console.log('当前刺激配对的颜色', combo_color);

        // // 生成trial_colors，trial_colors[0]=匹配颜色，trial_colors[1] & trial_colors[2] = 不匹配颜色
        // const mismatchedColors = colors.filter(color => color !== combo_color);   // 从 colors 中选择两个不匹配的颜色
        // const trial_color = [combo_color, ...mismatchedColors];
        // trial_colors.push(trial_color);
        // console.log('当前刺激用于平衡匹配的颜色', trial_color);   // 调试
        


        // 生成trial_label，trial_label[0]=匹配标签，trial_label[1] & trial_label[2] = 不匹配标签
        const trial_label = labels.map(l => {
            // console.log('比较的标签', l, combo_label);
            return l === combo_label ? combo_label : l; 
        });
        if (trial_label[0] !== combo_label) {
            const index = trial_label.indexOf(combo_label);
            if (index !== -1) {
                trial_label.unshift(trial_label.splice(index, 1)[0]);
            }
        }
        trial_labels.push(trial_label);
        // console.log('当前刺激用于平衡匹配的标签', trial_label);
        // console.log('所有刺激用于平衡匹配的标签', stml_Labels);
        // console.log('所有刺激用于平衡匹配的标签的数据类型', typeof trial_labels[0]);
        // console.log('当前刺激用于平衡匹配的标签的数据类型', typeof trial_label[0]);
        // console.log('输入的labels的数据类型', typeof labels[0]);
        // console.log('所有刺激的颜色', stml_colors);


    });

    return {trial_labels};
}

// 生成 timeline_variables
function ShapeColorTimelineVariables(colored_shapes) {
    const timeline_variables = [];

    colored_shapes.forEach((imagePath) => {
        const { stml_color, stml_shape } = extractColorAndShape(imagePath);
        const { combo_color, combo_label } = getLabelAndColorByShape(stml_shape);

        const trial = {
            stimulus: imagePath,
            stml_colors: stml_color,
            combo_colors: combo_color,
            combo_labels: combo_label,
            correct_key: stml_color === combo_color ? key[0] : key[1]
        };

        timeline_variables.push(trial);

        // 如果按键正确，重复配对颜色所在的试次
        if (trial.correct_key === key[0]) {
            timeline_variables.push(trial);
        }
    });

    return timeline_variables;
}



/** 变量定义 */
var labels = ["自我", "朋友", "生人"]   // 指导语与试次中都呈现的刺激--标签
var colors = ["red", "green", "blue"]  
var key = ['f', 'j']   // 被试按键
let acc = 70;   // 正确率70%才能通过练习
var info = []   // 存储被试信息：ID
info["ID"] = 123; // 方便测试


/* 获取所有颜色-图形-标签配对组合 共36种，9*4=36*/
const { results, cmbs } = generateCombinations(color_images, shape_images, labels);
combo = results[parseInt(info["ID"]) % 36];    // 颜色-形状-标签配对随ID随机，图片+文本
combo_text = cmbs[parseInt(info["ID"]) % 36];   // 颜色-形状-标签配对随ID随机，纯文本
key = permutation(key, 2)[parseInt(info["ID"]) % 2];   // 按键随被试ID随机
shuffledCombo = jsPsych.randomization.shuffle(combo)   // 配对的记忆顺序随机,最终呈现在指导语中

console.log("所有组合数:", cmbs.length);
console.log("所有组合:", cmbs);
console.log("随ID随机的组合，纯文字版:", combo_text);
console.log('随ID随机的组合：', combo);
console.log('随ID随机的按键：', key);
console.log('shuffled组合：', shuffledCombo);


/* 生成 trial_label */
const { trial_labels } = generateTrialLabels(colored_shapes);   // trial_label[0]=匹配标签，trial_label[1] & trial_label[2] = 不匹配标签
console.log('所有刺激用于平衡匹配的标签', trial_labels);
// console.log('所有刺激用于平衡匹配的颜色', trial_colors);   

/* 生成 timeline_variables */
const TIR_timeline_variables = ShapeColorTimelineVariables(colored_shapes);
console.log('TIR timeline_variables 数组:', TIR_timeline_variables);



// // 获取所有颜色-图形-标签配对组合，
// const colorPermutations = permutation(color_images, 3);
// const shapePermutations = permutation(shape_images, 3);
// results = [];   // 存储颜色-形状-标签配对，图片+文本
// cmbs = [];   // 存储颜色-形状-标签配对，纯文本，用于检查

// for (let colorPerm of colorPermutations) {
//     for (let shapePerm of shapePermutations) {
//         const combination = []; // 创建一个数组来存储当前的完整组合
//         const cmb = [];
//         for (let i = 0; i < 3; i++) {
//             combination.push(`<img src="${colorPerm[i]}" width=120 style="vertical-align: middle;"><span style="font-size: 25px;">-----</span><img src="${shapePerm[i]}" width=120 style="vertical-align: middle; margin-right: 60px;"><span style="position: relative; right: 60px; font-size: 25px;">-----&nbsp;${labels[i]}</span>`); 
//             cmb.push([colorPerm[i], shapePerm[i], labels[i]])
//         }
//         results.push(combination); // 将完整的组合添加到结果数组中
//         cmbs.push(cmb); 
//     }
// }


// 欢迎语
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


// 基本信息指导语
// var basic_information = {
//     type: jsPsychHtmlKeyboardResponse,
//     stimulus: `
//      <p>本实验首先需要您填写一些基本个人信息。</p>
//      <p> <div style = "color: green"><按任意键至下页></div></p>
//      `,
//     choices: "ALL_KEYS",
// };
// timeline.push(basic_information);




//方便测试
// info["ID"] = 123;
// shape_images = permutation(shape_images, 3)[parseInt(info["ID"]) % 6] // 使用被试ID随机化实验材料，将ID变为整数，使用余数作为随机图片组合的索引
// color_images = permutation(color_images, 3)[parseInt(info["ID"]) % 6]
// key = permutation(key, 2)[parseInt(info["ID"]) % 2]
// let shape_labels = [];

// jsPsych.randomization.shuffle(shape_images).forEach((v, i) => {   // 改变图形-标签记忆顺序，但图形-标签的配对关系不变
//     // shape_images.indexOf(v) 查找v在数组shape_images中的索引值，若v在数组中则返回索引值，若不在，则返回-1
//     shape_labels.push(`<img src="${v}" width=120 style="vertical-align: middle; margin-right: 60px;"><span style="position: relative; right: 60px; font-size: 25px;">-----&nbsp;${labels[shape_images.indexOf(v)]}</span>`);   // 尽管对shape_images进行二次随机，但没保存随机后的值，v索引对应的一直是随ID随机后的shape_images中的索引值
//     console.log('shape_images', v);
//     // console.log('shape_images的索引值', shape_images.indexOf(v));
//     console.log('shape_images对应的labels', labels[shape_images.indexOf(v)]);
//     Shape_Label_Map.set (v,`${labels[shape_images.indexOf(v)]}`);
//     })
// let color_shape_labels = []   // 存储颜色-图形-标签的对应关系
// // let instr_color = [];
// jsPsych.randomization.shuffle(color_images).forEach((v, i) => {   
//     color_shape_labels.push(`<img src="${v}" width=120 style="vertical-align: middle;"><span style="font-size: 25px;">-----${Shape_Label_Map.get(color_images.indexOf(v))}</span>`);   // shape_labels存储的图形-标签对顺序会变,这种写法会让颜色每次配对的图形标签都发生变化
//     // paired_label = shape_labels[color_images.indexOf(v)].match(/<span[^>]*>([^<]+)<\/span>/)[1].trim().replace(/-----&nbsp;/, '');   // 提取出标签
//     console.log('颜色配对的形状-标签', color_shape_labels)
//     // console.log('配对的标签', paired_label)
//     shape = shape_labels[color_images.indexOf(v)].match(/src="([^"]+)"/)[1].split('/').pop().replace(/\.\w+$/, '');   // 提取出shape
//     instr_color = (v.split('/').pop().replace(/\.\w+$/, ''));
//     console.log('color_images', v);
//     // console.log('color_images的索引值', color_images.indexOf(v));
//     console.log('color_images对应的view_texts_images', color_shape_labels);
//     Color_Shape_Map.set (instr_color,`${shape}`);
//     })
// console.log('shape_images随ID随机', shape_images);
// console.log('color_images随ID随机', color_images);
// console.log('形状-标签对应关系', color_shape_labels);
// console.log('color_images的颜色', instr_color);
// console.log('颜色-图形映射', Color_Shape_Map);
// console.log('颜色-图形-标签对应关系', Color_Shape_Label_Map);






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
var Instructions = {
    type: jsPsychInstructions,
    pages: function () {
        let start = "<p class='header' style = 'font-size: 35px'>请您记住如下对应关系:</p>",
            middle = "<p class='footer'  style = 'font-size: 35px'>如果对本实验还有不清楚之处，请立即向实验员咨询。</p>",
            end = "<p style = 'font-size: 35px; line-height: 30px;'>如果您记住了三个对应关系及按键规则，请点击 继续 </span></p><div>";
        let tmpI = "";
        for (const element of shuffledCombo) {
             tmpI += `<div style="text-align: center; height: 18vh; display: flex; align-items: center;">${element}</div>`
        }
        return [`<p class='header' style = 'font-size: 35px'>实验说明：</p>
            <p style='color:white; font-size: 35px;line-height: 30px;'>您好,欢迎参加本实验。本次实验大约需要45分钟完成。</p>
            <p style='color:white; font-size: 35px;'>在本实验中，您需要完成一个知觉匹配任务与一个图形分类任务。</p>
            <p style='color:white; font-size: 35px;'>在任务开始前，您将学习三种图形与三种标签的对应关系。</p>`,
            start + `<div class="box">${tmpI}</div>`,
            `<p class='footer' style='font-size: 35px; line-height: 30px;'>首先进行知觉匹配任务。</p>
      <p class='footer' style='font-size: 35px; line-height: 30px;'>在知觉匹配任务中，您的任务是判断图形与文字标签是否匹配，</p>
      <p class='footer' style='color:white; font-size: 35px;'>如果二者<span style="color: lightgreen;">匹配</span>，请按键盘 <span style="color: lightgreen; font-size:35px">${key[0]}</span></p>
      <p class='footer' style='color:white; font-size: 35px;'>如果二者<span style="color: lightgreen;">不匹配</span>，请按键盘<span style="color: lightgreen; font-size:35px"> ${key[1]}</p></span>
      <p class='footer' style='color:white; font-size: 22px;'>请在实验过程中将您右手的<span style="color: lightgreen;">食指和无名指</span>放在电脑键盘的相应键位上准备按键。</p></span>`,
            `<p style='color:white; font-size: 35px; line-height: 30px;'>接下来，您将进入知觉匹配任务的练习部分</p>
      <p class='footer' style='color:lightgreen; font-size: 35px;'>请您又快又准地进行按键。</p>
      <p style='color:white; font-size: 35px; line-height: 30px;'>通过练习后,您将进入知觉匹配任务的正式试验。</p>
      <p class='footer' style='color:white; font-size: 35px;'>正式试验分为5组,每组完成后会有休息时间。</p></span>`,
            middle + end];
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
timeline.push(Instructions);

// 知觉匹配任务：练习阶段

// Task Relevant: 呈现colored_shapes、+、labels
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
//         { colShapes: function () { return colored_shapes[0] }, shape: function () { return stml_Labels[0] }, color: function () {return stml_colors[0]}, labels: function () { return trial_labels[0][0] }, identify: function () { return key[0] } },
//         { colShapes: function () { return colored_shapes[0] }, shape: function () { return stml_Labels[0] }, color: function () {return stml_colors[0]}, labels: function () { return trial_labels[0][0] }, identify: function () { return key[0] } },
//         { colShapes: function () { return colored_shapes[0] }, shape: function () { return stml_Labels[0] }, color: function () {return stml_colors[0]}, labels: function () { return trial_labels[0][1] }, identify: function () { return key[1] } },
//         { colShapes: function () { return colored_shapes[0] }, shape: function () { return stml_Labels[0] }, color: function () {return stml_colors[0]}, labels: function () { return trial_labels[0][2] }, identify: function () { return key[1] } },

//         { colShapes: function () { return colored_shapes[1] }, shape: function () { return stml_Labels[1] }, color: function () {return stml_colors[1]}, labels: function () { return trial_labels[1][0] }, identify: function () { return key[0] } },
//         { colShapes: function () { return colored_shapes[1] }, shape: function () { return stml_Labels[1] }, color: function () {return stml_colors[1]}, labels: function () { return trial_labels[1][0] }, identify: function () { return key[0] } },
//         { colShapes: function () { return colored_shapes[1] }, shape: function () { return stml_Labels[1] }, color: function () {return stml_colors[1]}, labels: function () { return trial_labels[1][1] }, identify: function () { return key[1] } },
//         { colShapes: function () { return colored_shapes[1] }, shape: function () { return stml_Labels[1] }, color: function () {return stml_colors[1]}, labels: function () { return trial_labels[1][2] }, identify: function () { return key[1] } },

//         { colShapes: function () { return colored_shapes[2] }, shape: function () { return stml_Labels[2] }, color: function () {return stml_colors[2]}, labels: function () { return trial_labels[2][0] }, identify: function () { return key[0] } },
//         { colShapes: function () { return colored_shapes[2] }, shape: function () { return stml_Labels[2] }, color: function () {return stml_colors[2]}, labels: function () { return trial_labels[2][0] }, identify: function () { return key[0] } },
//         { colShapes: function () { return colored_shapes[2] }, shape: function () { return stml_Labels[2] }, color: function () {return stml_colors[2]}, labels: function () { return trial_labels[2][1] }, identify: function () { return key[1] } },
//         { colShapes: function () { return colored_shapes[2] }, shape: function () { return stml_Labels[2] }, color: function () {return stml_colors[2]}, labels: function () { return trial_labels[2][2] }, identify: function () { return key[1] } },

//         { colShapes: function () { return colored_shapes[3] }, shape: function () { return stml_Labels[3] }, color: function () {return stml_colors[3]}, labels: function () { return trial_labels[3][0] }, identify: function () { return key[0] } },
//         { colShapes: function () { return colored_shapes[3] }, shape: function () { return stml_Labels[3] }, color: function () {return stml_colors[3]}, labels: function () { return trial_labels[3][0] }, identify: function () { return key[0] } },
//         { colShapes: function () { return colored_shapes[3] }, shape: function () { return stml_Labels[3] }, color: function () {return stml_colors[3]}, labels: function () { return trial_labels[3][1] }, identify: function () { return key[1] } },
//         { colShapes: function () { return colored_shapes[3] }, shape: function () { return stml_Labels[3] }, color: function () {return stml_colors[3]}, labels: function () { return trial_labels[3][2] }, identify: function () { return key[1] } },

//         { colShapes: function () { return colored_shapes[4] }, shape: function () { return stml_Labels[4] }, color: function () {return stml_colors[4]}, labels: function () { return trial_labels[4][0] }, identify: function () { return key[0] } },
//         { colShapes: function () { return colored_shapes[4] }, shape: function () { return stml_Labels[4] }, color: function () {return stml_colors[4]}, labels: function () { return trial_labels[4][0] }, identify: function () { return key[0] } },
//         { colShapes: function () { return colored_shapes[4] }, shape: function () { return stml_Labels[4] }, color: function () {return stml_colors[4]}, labels: function () { return trial_labels[4][1] }, identify: function () { return key[1] } },
//         { colShapes: function () { return colored_shapes[4] }, shape: function () { return stml_Labels[4] }, color: function () {return stml_colors[4]}, labels: function () { return trial_labels[4][2] }, identify: function () { return key[1] } },

//         { colShapes: function () { return colored_shapes[5] }, shape: function () { return stml_Labels[5] }, color: function () {return stml_colors[5]}, labels: function () { return trial_labels[5][0] }, identify: function () { return key[0] } },
//         { colShapes: function () { return colored_shapes[5] }, shape: function () { return stml_Labels[5] }, color: function () {return stml_colors[5]}, labels: function () { return trial_labels[5][0] }, identify: function () { return key[0] } },
//         { colShapes: function () { return colored_shapes[5] }, shape: function () { return stml_Labels[5] }, color: function () {return stml_colors[5]}, labels: function () { return trial_labels[5][1] }, identify: function () { return key[1] } },
//         { colShapes: function () { return colored_shapes[5] }, shape: function () { return stml_Labels[5] }, color: function () {return stml_colors[5]}, labels: function () { return trial_labels[5][2] }, identify: function () { return key[1] } },

//         { colShapes: function () { return colored_shapes[6] }, shape: function () { return stml_Labels[6] }, color: function () {return stml_colors[6]}, labels: function () { return trial_labels[6][0] }, identify: function () { return key[0] } },
//         { colShapes: function () { return colored_shapes[6] }, shape: function () { return stml_Labels[6] }, color: function () {return stml_colors[6]}, labels: function () { return trial_labels[6][0] }, identify: function () { return key[0] } },
//         { colShapes: function () { return colored_shapes[6] }, shape: function () { return stml_Labels[6] }, color: function () {return stml_colors[6]}, labels: function () { return trial_labels[6][1] }, identify: function () { return key[1] } },
//         { colShapes: function () { return colored_shapes[6] }, shape: function () { return stml_Labels[6] }, color: function () {return stml_colors[6]}, labels: function () { return trial_labels[6][2] }, identify: function () { return key[1] } },

//         { colShapes: function () { return colored_shapes[7] }, shape: function () { return stml_Labels[7] }, color: function () {return stml_colors[7]}, labels: function () { return trial_labels[7][0] }, identify: function () { return key[0] } },
//         { colShapes: function () { return colored_shapes[7] }, shape: function () { return stml_Labels[7] }, color: function () {return stml_colors[7]}, labels: function () { return trial_labels[7][0] }, identify: function () { return key[0] } },
//         { colShapes: function () { return colored_shapes[7] }, shape: function () { return stml_Labels[7] }, color: function () {return stml_colors[7]}, labels: function () { return trial_labels[7][1] }, identify: function () { return key[1] } },
//         { colShapes: function () { return colored_shapes[7] }, shape: function () { return stml_Labels[7] }, color: function () {return stml_colors[7]}, labels: function () { return trial_labels[7][2] }, identify: function () { return key[1] } },

//         { colShapes: function () { return colored_shapes[8] }, shape: function () { return stml_Labels[8] }, color: function () {return stml_colors[8]}, labels: function () { return trial_labels[8][0] }, identify: function () { return key[0] } },
//         { colShapes: function () { return colored_shapes[8] }, shape: function () { return stml_Labels[8] }, color: function () {return stml_colors[8]}, labels: function () { return trial_labels[8][0] }, identify: function () { return key[0] } },
//         { colShapes: function () { return colored_shapes[8] }, shape: function () { return stml_Labels[8] }, color: function () {return stml_colors[8]}, labels: function () { return trial_labels[8][1] }, identify: function () { return key[1] } },
//         { colShapes: function () { return colored_shapes[8] }, shape: function () { return stml_Labels[8] }, color: function () {return stml_colors[8]}, labels: function () { return trial_labels[8][2] }, identify: function () { return key[1] } },
//     ],
//     randomize_order: true,   //6
//     repetitions: 1,   // 练习重复1次，练习试次36个
//     on_load: () => {
//         $("body").css("cursor", "none");
//     },
//     on_finish: function () {
//          $("body").css("cursor", "default"); 
//     }
// }

// timeline.push(TR_prac);

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
                    show_end_time: 25000   // 1100
                },
                {
                    obj_type: "image",   // colored_shapes
                    file: function () { return jsPsych.timelineVariable('stimulus') },
                    startX: "center",
                    startY: "center",   // 肉眼等距
                    scale: 0.7,   // 图片缩小0.7倍
                    width: 190,   // 调整图片大小 视角：3.8° x 3.8°
                    heigth: 190,   // 调整图片大小 视角：3.8° x 3.8°
                    show_start_time: 1000, 
                    show_end_time: 25000,   // 1100
                    origin_center: true
                }
            ],

            choices: ['f', 'j'],
            response_start_time: 1000,
            trial_duration: 25000,
            on_start: function() {
                console.log('colShapes of this trial:', jsPsych.timelineVariable('stimulus'));
                // console.log('shape of this trial:', jsPsych.timelineVariable('shape'));
                console.log('color of this trial:', jsPsych.timelineVariable('stml_colors'));
                console.log('combocolor of this trial:', jsPsych.timelineVariable('combo_colors'));
                console.log('labels of this trial:', jsPsych.timelineVariable('combo_labels'));
                console.log('correct_response of this trial:', jsPsych.timelineVariable('correct_key'));
            },
            on_finish: function (data) {
                data.correct_key = jsPsych.timelineVariable('correct_key');
                data.correct = data.correct_key === data.key_press;
                data.shapes = jsPsych.timelineVariable("combo_labels");
                data.stml_colors = jsPsych.timelineVariable("stml_colors");
                data.combo_colors = jsPsych.timelineVariable("combo_colors");
                data.ismatch = data.stml_colors === data.combo_colors;
                data.condition = "TIR_prac";
                console.log('correct_key:', data.correct_key);
            },
        },
        {   // 每个试次后反馈
            type: jsPsychHtmlKeyboardResponse,
            stimulus: function () {
                let keypress = jsPsych.data.get().last(1).values()[0].key_press; // 被试按键
                console.log('keypress:', keypress);
                let time = jsPsych.data.get().last(1).values()[0].rt;
                let trial_correct_response = jsPsych.data.get().last(1).values()[0].correct_key;//该trial正确的按键
                console.log('trial_correct_response:',trial_correct_response);
                if (time > 15000 || time === null) { //大于1500或为null为过慢
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

    timeline_variables: TIR_timeline_variables,
       
    randomize_order: true,
    repetitions: 1,   // 练习重复1次，练习试次12个
    on_load: () => {
        $("body").css("cursor", "none");
    },
    on_finish: function () {
         $("body").css("cursor", "default"); 
    }
}
timeline.push(TIR_prac);
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

