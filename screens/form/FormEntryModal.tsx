import React, { useState, useEffect } from 'react';
import {
    Modal,
    Form,
    Input,
    Select,
    Button,
    Space,
    InputNumber,
    Divider,
    Card,
    Typography,
    Table,
    message,
    Row,
    Col,
    Tag,
    Tabs
} from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { UserService } from '@/services/userService';
import { HandBagService } from '@/services/handBagService';
import { BagProcessService } from '@/services/bagProcessService';
import {
    DigitalFormEntry,
    AttendanceStatus,
    ProductionIssueType,
    ShiftType,
    STANDARD_TIME_INTERVALS
} from '@/types/digitalForm';

const { Option } = Select;
const { Text } = Typography;
const { TabPane } = Tabs;

interface FormEntryModalProps {
    visible: boolean;
    onCancel: () => void;
    onSave: (values: any) => void;
    entry: DigitalFormEntry | null;
    formId: string;
    shiftType: ShiftType;
}

interface WorkerOption {
    id: string;
    fullName: string;
    employeeId: string;
}

interface HandBagOption {
    id: string;
    code: string;
    name: string;
}

interface BagColorOption {
    id: string;
    colorCode: string;
    colorName: string;
}

interface ProcessOption {
    id: string;
    code: string;
    name: string;
}

const FormEntryModal: React.FC<FormEntryModalProps> = ({
    visible,
    onCancel,
    onSave,
    entry,
    formId,
    shiftType,
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [workers, setWorkers] = useState<WorkerOption[]>([]);
    const [handBags, setHandBags] = useState<HandBagOption[]>([]);
    const [bagColors, setBagColors] = useState<BagColorOption[]>([]);
    const [processes, setProcesses] = useState<ProcessOption[]>([]);
    const [selectedHandbagId, setSelectedHandbagId] = useState<string | null>(null);

    // Get the appropriate time intervals based on shift type
    const getTimeIntervals = () => {
        if (shiftType === 'REGULAR') {
            return STANDARD_TIME_INTERVALS.slice(0, 9); // Regular shift (7:30-16:30)
        } else if (shiftType === 'EXTENDED') {
            return STANDARD_TIME_INTERVALS.slice(8, 11); // Extended shift (16:30-18:00)
        } else {
            return STANDARD_TIME_INTERVALS.slice(10, 13); // Overtime shift (18:00-20:00)
        }
    };

    const timeIntervals = getTimeIntervals();

    useEffect(() => {
        if (visible) {
            fetchData();
            initializeForm();
        }
    }, [visible, entry]);

    // When handbag selection changes, fetch its colors
    useEffect(() => {
        if (selectedHandbagId) {
            fetchBagColors(selectedHandbagId);
        } else {
            setBagColors([]);
        }
    }, [selectedHandbagId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch workers, handbags, and processes in parallel
            const [workersResponse, handBagsResponse, processesResponse] = await Promise.all([
                UserService.getUsers({ role: 'WORKER' }),
                HandBagService.getHandBags(),
                BagProcessService.getProcesses()
            ]);

            if (workersResponse.success) {
                setWorkers(workersResponse.data);
            }

            if (handBagsResponse.success) {
                setHandBags(handBagsResponse.data);
            }

            if (processesResponse.success) {
                setProcesses(processesResponse.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            message.error('Failed to load options');
        } finally {
            setLoading(false);
        }
    };

    const fetchBagColors = async (handBagId: string) => {
        try {
            const response = await HandBagService.getBagColors(handBagId);
            if (response.success) {
                setBagColors(response.data);
            } else {
                setBagColors([]);
            }
        } catch (error) {
            console.error('Error fetching bag colors:', error);
            setBagColors([]);
        }
    };

    const initializeForm = () => {
        form.resetFields();

        if (entry) {
            // If editing an existing entry
            setSelectedHandbagId(entry.handBagId);

            // Prepare form values
            const formValues = {
                userId: entry.userId,
                handBagId: entry.handBagId,
                bagColorId: entry.bagColorId,
                processId: entry.processId,
                attendanceStatus: entry.attendanceStatus,
                attendanceNote: entry.attendanceNote,
                qualityScore: entry.qualityScore,
                qualityNotes: entry.qualityNotes,
                issues: entry.issues || [],
            };

            // Add hourly data fields
            timeIntervals.forEach(interval => {
                formValues[`hourly_${interval.label}`] = entry.hourlyData?.[interval.label] || 0;
            });

            form.setFieldsValue(formValues);
        }
    };

    const calculateTotalOutput = (values) => {
        let total = 0;
        // Sum up hourly values
        timeIntervals.forEach(interval => {
            total += values[`hourly_${interval.label}`] || 0;
        });
        return total;
    };

    const handleOk = () => {
        form
            .validateFields()
            .then((values) => {
                // Prepare entry data
                const hourlyData = {};
                timeIntervals.forEach(interval => {
                    hourlyData[interval.label] = values[`hourly_${interval.label}`] || 0;
                });

                const entryData = {
                    userId: values.userId,
                    handBagId: values.handBagId,
                    bagColorId: values.bagColorId,
                    processId: values.processId,
                    hourlyData,
                    totalOutput: calculateTotalOutput(values),
                    attendanceStatus: values.attendanceStatus,
                    attendanceNote: values.attendanceNote,
                    issues: values.issues,
                    qualityScore: values.qualityScore,
                    qualityNotes: values.qualityNotes,
                };

                onSave(entryData);
            })
            .catch((info) => {
                console.log('Validate Failed:', info);
            });
    };

    return (
        <Modal
            title={entry ? "Edit Production Entry" : "Add Production Entry"}
            visible={visible}
            onCancel={onCancel}
            footer={[
                <Button key="back" onClick={onCancel}>
                    Cancel
                </Button>,
                <Button key="submit" type="primary" loading={loading} onClick={handleOk}>
                    Save
                </Button>,
            ]}
            width={800}
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    userId: '',
                    handBagId: '',
                    bagColorId: '',
                    processId: '',
                    attendanceStatus: 'PRESENT',
                    attendanceNote: '',
                    qualityScore: 100,
                    qualityNotes: '',
                    issues: [],
                }}
            >
                <Tabs defaultActiveKey="1">
                    <TabPane tab="Basic Information" key="1">
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="userId"
                                    label="Worker"
                                    rules={[
                                        {
                                            required: true,
                                            message: 'Please select a worker',
                                        },
                                    ]}
                                >
                                    <Select
                                        placeholder="Select worker"
                                        loading={loading}
                                        showSearch
                                        optionFilterProp="children"
                                    >
                                        {workers.map((worker) => (
                                            <Option key={worker.id} value={worker.id}>
                                                {worker.fullName} ({worker.employeeId})
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="attendanceStatus"
                                    label="Attendance Status"
                                    rules={[
                                        {
                                            required: true,
                                            message: 'Please select attendance status',
                                        },
                                    ]}
                                >
                                    <Select placeholder="Select status">
                                        <Option value="PRESENT">Present</Option>
                                        <Option value="ABSENT">Absent</Option>
                                        <Option value="LATE">Late</Option>
                                        <Option value="EARLY_LEAVE">Early Leave</Option>
                                        <Option value="LEAVE_APPROVED">Leave Approved</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="handBagId"
                                    label="Handbag"
                                    rules={[
                                        {
                                            required: true,
                                            message: 'Please select a handbag',
                                        },
                                    ]}
                                >
                                    <Select
                                        placeholder="Select handbag"
                                        loading={loading}
                                        showSearch
                                        optionFilterProp="children"
                                        onChange={(value) => setSelectedHandbagId(value)}
                                    >
                                        {handBags.map((bag) => (
                                            <Option key={bag.id} value={bag.id}>
                                                {bag.name} ({bag.code})
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="bagColorId"
                                    label="Bag Color"
                                    rules={[
                                        {
                                            required: true,
                                            message: 'Please select a color',
                                        },
                                    ]}
                                >
                                    <Select
                                        placeholder={selectedHandbagId ? "Select color" : "Select handbag first"}
                                        loading={loading}
                                        showSearch
                                        optionFilterProp="children"
                                        disabled={!selectedHandbagId}
                                    >
                                        {bagColors.map((color) => (
                                            <Option key={color.id} value={color.id}>
                                                {color.colorName} ({color.colorCode})
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            name="processId"
                            label="Production Process"
                            rules={[
                                {
                                    required: true,
                                    message: 'Please select a process',
                                },
                            ]}
                        >
                            <Select
                                placeholder="Select process"
                                loading={loading}
                                showSearch
                                optionFilterProp="children"
                            >
                                {processes.map((process) => (
                                    <Option key={process.id} value={process.id}>
                                        {process.name} ({process.code})
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="attendanceNote"
                            label="Attendance Note"
                        >
                            <Input.TextArea
                                placeholder="Enter any attendance notes"
                                rows={2}
                            />
                        </Form.Item>
                    </TabPane>

                    <TabPane tab="Hourly Production" key="2">
                        <div className="hourly-inputs">
                            <Card size="small" title="Hourly Output">
                                <Row gutter={[8, 16]}>
                                    {timeIntervals.map((interval) => (
                                        <Col span={8} key={interval.label}>
                                            <Form.Item
                                                name={`hourly_${interval.label}`}
                                                label={interval.label}
                                                initialValue={0}
                                            >
                                                <InputNumber
                                                    min={0}
                                                    placeholder="Output"
                                                    style={{ width: '100%' }}
                                                />
                                            </Form.Item>
                                        </Col>
                                    ))}
                                </Row>
                            </Card>
                        </div>
                    </TabPane>

                    <TabPane tab="Quality & Issues" key="3">
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="qualityScore"
                                    label="Quality Score (%)"
                                    initialValue={100}
                                >
                                    <InputNumber
                                        min={0}
                                        max={100}
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="qualityNotes"
                                    label="Quality Notes"
                                >
                                    <Input.TextArea
                                        placeholder="Enter quality notes"
                                        rows={2}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Divider orientation="left">Production Issues</Divider>

                        <Form.List name="issues">
                            {(fields, { add, remove }) => (
                                <>
                                    {fields.map(({ key, name, ...restField }) => (
                                        <Space
                                            key={key}
                                            style={{ display: 'flex', marginBottom: 8 }}
                                            align="baseline"
                                        >
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'type']}
                                                rules={[{ required: true, message: 'Issue type required' }]}
                                            >
                                                <Select placeholder="Issue type" style={{ width: 150 }}>
                                                    <Option value="ABSENT">Absent</Option>
                                                    <Option value="LATE">Late</Option>
                                                    <Option value="WAITING_MATERIALS">Waiting Materials</Option>
                                                    <Option value="QUALITY_ISSUES">Quality Issues</Option>
                                                    <Option value="LOST_MATERIALS">Lost Materials</Option>
                                                    <Option value="OTHER">Other</Option>
                                                </Select>
                                            </Form.Item>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'hour']}
                                                rules={[{ required: true, message: 'Hour required' }]}
                                            >
                                                <Select placeholder="Hour" style={{ width: 100 }}>
                                                    {timeIntervals.map((interval) => (
                                                        <Option key={interval.label} value={interval.label}>
                                                            {interval.label}
                                                        </Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'impact']}
                                                rules={[{ required: true, message: 'Impact % required' }]}
                                            >
                                                <InputNumber
                                                    placeholder="Impact %"
                                                    min={0}
                                                    max={100}
                                                    style={{ width: 100 }}
                                                />
                                            </Form.Item>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'description']}
                                            >
                                                <Input placeholder="Description" style={{ width: 200 }} />
                                            </Form.Item>
                                            <MinusCircleOutlined onClick={() => remove(name)} />
                                        </Space>
                                    ))}
                                    <Form.Item>
                                        <Button
                                            type="dashed"
                                            onClick={() => add()}
                                            block
                                            icon={<PlusOutlined />}
                                        >
                                            Add Production Issue
                                        </Button>
                                    </Form.Item>
                                </>
                            )}
                        </Form.List>
                    </TabPane>
                </Tabs>
            </Form>
        </Modal>
    );
};

export default FormEntryModal;