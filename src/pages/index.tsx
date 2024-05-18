import { Button, Form, Input, Select, DatePicker, TimePicker } from 'antd';
import React, { useState } from 'react';
import moment from 'moment';
import styles from './index.less';
import { formatTimeStr } from 'antd/lib/statistic/utils';

const { Option } = Select;

const layout = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
};
const tailLayout = {
    wrapperCol: { offset: 8, span: 16 },
};

const format = 'HH:mm';

const Time = (props) => {
    const { value: { date, time } = { date: moment() }, onChange } = props;
    const onDateChange = (date) => {
        onChange({
            date,
            time: props.value?.time,
        });
    };
    const onTimeChange = (time) => {
        onChange({
            date: props.value?.date || moment(),
            time,
        })
    };
    return <div>
        <DatePicker value={date} onChange={onDateChange}/>
        <TimePicker value={time} format={format} onChange={onTimeChange} allowClear showNow={false}/>
    </div>
}

function formatTimeObj(timeObj) {
    if (!timeObj) return null;
    let { date, time} = timeObj; 
    if (!date) date = moment();
    if (!time) return null; 
    const dateString = date.format('YYYY-MM-DD');
    const timeString = time.format('HH:mm:ss');
    return moment(`${dateString} ${timeString}`);
}

function msToTime(ms: number) {
    // 1 秒 = 1000 毫秒
    const seconds = Math.floor(ms / 1000);
  
    // 1 分钟 = 60 秒
    const minutes = Math.floor(seconds / 60);
  
    // 1 小时 = 60 分钟
    const hours = Math.floor(minutes / 60);
  
    // 剩余秒数
    const remainingSeconds = seconds % 60;
  
    // 剩余分钟数
    const remainingMinutes = minutes % 60;
  
    return `${hours}小时${remainingMinutes}分钟${remainingSeconds}秒`; 
  }

const App: React.FC = () => {
    const [form] = Form.useForm();
    const [isError, setIsError] = useState(true);
    const [lastWorkTime, setLastWorkTime] = useState<string>('');
    const [planWorkTime, setPlanWorkTime] = useState<string>('');


    const onReset = () => {
        form.resetFields();
    };

    const initialValues = {
        flightCrewNum: '2',
        restZoneType: '3',
    };

    const onValuesChange = (changedValues, allValues) => {
        const val = {
            ...allValues,
            ...changedValues,
        };
        const {
            signTime: rawSignTime,
            flightLandingTime: rawFlightLandingTime,
            secondCloseTime: rawSecondCloseTime,
            secondTakeOffTime: rawSecondTakeOffTime,
            thirdCloseTime: rawThirdCloseTime,
            thirdTakeOffTime: rawThirdTakeOffTime,
            flightCrewNum,
            restZoneType,
        } = val;
        const signTime = formatTimeObj(rawSignTime);
        const flightLandingTime = formatTimeObj(rawFlightLandingTime);
        const secondCloseTime = formatTimeObj(rawSecondCloseTime);
        const secondTakeOffTime = formatTimeObj(rawSecondTakeOffTime);
        const thirdCloseTime = formatTimeObj(rawThirdCloseTime);
        const thirdTakeOffTime = formatTimeObj(rawThirdTakeOffTime);
        if (!signTime || !flightLandingTime) {
            setIsError(true);
            return;
        }
        let errorFlag = false;
        let currPlanWorkTime: number;
        if (!secondCloseTime && !secondTakeOffTime && !thirdCloseTime && !thirdTakeOffTime) {
            currPlanWorkTime = flightLandingTime?.valueOf() - signTime?.valueOf();
        } else if (secondCloseTime && secondTakeOffTime && !thirdCloseTime && !thirdTakeOffTime) {
            currPlanWorkTime = flightLandingTime?.valueOf() - signTime?.valueOf() - secondTakeOffTime.valueOf() + secondCloseTime.valueOf() + 4500*1000;
        } else if (secondCloseTime && secondTakeOffTime && thirdCloseTime && thirdTakeOffTime) {
            currPlanWorkTime = flightLandingTime?.valueOf() - signTime?.valueOf() - secondTakeOffTime.valueOf() + secondCloseTime.valueOf() - thirdTakeOffTime.valueOf() + thirdCloseTime.valueOf() + 9000*1000;
        } else {
            errorFlag = true;
        }
        if (errorFlag) {
            setIsError(true);
            return;
        }
        let currLastWorkTime = moment();
        if (flightCrewNum === '2' && restZoneType === '3') {
            const signHour = signTime.hour();
            if (signHour < 5) {
                currLastWorkTime = flightLandingTime.add(14 * 60 * 60 * 1000 - currPlanWorkTime!, 'milliseconds')
            } else if (signHour < 12) {
                currLastWorkTime = flightLandingTime.add(16 * 60 * 60 * 1000 - currPlanWorkTime!, 'milliseconds')
            } else {
                currLastWorkTime = flightLandingTime.add(15 * 60 * 60 * 1000 - currPlanWorkTime!, 'milliseconds')
            }
        } else if (flightCrewNum === '3' && restZoneType === '3') {
            currLastWorkTime = flightLandingTime.add(18 * 60 * 60 * 1000 - currPlanWorkTime!, 'milliseconds')
        } else if (flightCrewNum === '3' && restZoneType === '1') {
            currLastWorkTime = flightLandingTime.add(20 * 60 * 60 * 1000 - currPlanWorkTime!, 'milliseconds')
        } else if (flightCrewNum === '4' && restZoneType === '3') {
            currLastWorkTime = flightLandingTime.add(20 * 60 * 60 * 1000 - currPlanWorkTime!, 'milliseconds')
        } else if (flightCrewNum === '4' && restZoneType === '1') {
            currLastWorkTime = flightLandingTime.add(22 * 60 * 60 * 1000 - currPlanWorkTime!, 'milliseconds')
        }
        setIsError(false);
        setPlanWorkTime(msToTime(currPlanWorkTime!));
        setLastWorkTime(currLastWorkTime.format('YYYY-MM-DD HH:mm'));
    };

    return (
        <div>
            <p>执勤期计算</p>
             <Form {...layout} form={form} name="flightTimeCalc" initialValues={initialValues} onValuesChange={onValuesChange}>
            <Form.Item label="签到时间" name="signTime" rules={[{ required: true }]}>
                <Time />
            </Form.Item>
            <Form.Item label="全天航班计划落地时间" name="flightLandingTime" rules={[{ required: true }]}>
                <Time />
            </Form.Item>
            <Form.Item label="二次进场前关车时刻" name="secondCloseTime" rules={[{ required: false }]}>
            <Time />
            </Form.Item>
            <Form.Item label="二次进场预计起飞时刻" name="secondTakeOffTime" rules={[{ required: false }]}>
            <Time />
            </Form.Item>
            <Form.Item label="三次进场前关车时刻" name="thirdCloseTime" rules={[{ required: false }]}>
            <Time />
            </Form.Item>
            <Form.Item label="三次进场预计起飞时刻" name="thirdTakeOffTime" rules={[{ required: false }]}>
            <Time />
            </Form.Item>
            <Form.Item label="扩编机组" name="flightCrewNum" rules={[{ required: true }]}>
                <Select>
                    <Option value="2">2 人制（非扩编）</Option>
                    <Option value="3">3 人制</Option>
                    <Option value="4">4 人制</Option>
                </Select>
            </Form.Item>
            <Form.Item label="休息区" name="restZoneType" rules={[{ required: true }]}>
                <Select>
                    <Option value="1">1 级</Option>
                    <Option value="3">3 级</Option>
                </Select>
            </Form.Item>
        </Form>
        <div className={styles.result}>
            { isError ? <p>输入异常</p> : <p>您当前任务计划执勤时长为{planWorkTime}，最晚执勤至{lastWorkTime}</p> }
        </div>
        </div>
    );
};

export default App;
