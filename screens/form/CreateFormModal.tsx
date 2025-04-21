import React, { useState, useEffect } from 'react';
import {
    Modal,
    Form,
    Input,
    DatePicker,
    Select,
    Button,
    message
} from 'antd';
import { LineService } from '@/services/lineService';
import { Line } from '@/types/line';
import { ShiftType } from '@/types/digitalForm';

const { Option } = Select;
const { TextArea } = Input;

interface CreateFormModalProps {
    visible: boolean;
    onCancel: () => void;
    onCreate: (values: any) => void;
}

const CreateFormModal: React.FC<CreateFormModalProps> = ({
    visible,
    onCancel,
    onCreate,
}) => {
    const [form] = Form.useForm();
    const [lines, setLines] = useState<Line[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            fetchLines();
            form.resetFields();
        }
    }, [visible]);

    const fetchLines = async () => {
        try {
            setLoading(true);
            const response = await LineService.getLines();
            if (response.success) {
                setLines(response.data);
            } else {
                message.error('Failed to fetch lines');
            }
        } catch (error) {
            console.error('Error fetching lines:', error);
            message.error('An error occurred while fetching lines');
        } finally {
            setLoading(false);
        }
    };

    const handleOk = () => {
        form
            .validateFields()
            .then((values) => {
                // Format the date string
                values.date = values.date.format('YYYY-MM-DD');

                // Pass the values to the onCreate function
                onCreate(values);
            })
            .catch((info) => {
                console.log('Validate Failed:', info);
            });
    };

    return (
        <Modal
            title="Create Digital Production Form"
            visible={visible}
            onCancel={onCancel}
            onOk={handleOk}
            confirmLoading={loading}
            width={600}
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    formName: '',
                    description: '',
                    date: null,
                    shiftType: 'REGULAR',
                    lineId: undefined,
                }}
            >
                <Form.Item
                    name="formName"
                    label="Form Name"
                    rules={[
                        {
                            required: true,
                            message: 'Please enter a name for the form',
                        },
                    ]}
                >
                    <Input placeholder="Enter form name" />
                </Form.Item>

                <Form.Item
                    name="description"
                    label="Description"
                >
                    <TextArea
                        placeholder="Enter description (optional)"
                        rows={3}
                    />
                </Form.Item>

                <Form.Item
                    name="date"
                    label="Date"
                    rules={[
                        {
                            required: true,
                            message: 'Please select a date',
                        },
                    ]}
                >
                    <DatePicker
                        style={{ width: '100%' }}
                        format="DD/MM/YYYY"
                    />
                </Form.Item>

                <Form.Item
                    name="shiftType"
                    label="Shift"
                    rules={[
                        {
                            required: true,
                            message: 'Please select a shift',
                        },
                    ]}
                >
                    <Select placeholder="Select shift">
                        <Option value="REGULAR">Regular (7:30-16:30)</Option>
                        <Option value="EXTENDED">Extended (16:30-18:00)</Option>
                        <Option value="OVERTIME">Overtime (18:00-20:00)</Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    name="lineId"
                    label="Production Line"
                    rules={[
                        {
                            required: true,
                            message: 'Please select a production line',
                        },
                    ]}
                >
                    <Select placeholder="Select line" loading={loading}>
                        {lines.map((line) => (
                            <Option key={line.id} value={line.id}>
                                {line.name} ({line.code})
                            </Option>
                        ))}
                    </Select>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default CreateFormModal;