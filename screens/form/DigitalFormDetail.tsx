import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
    Button,
    Card,
    Typography,
    Descriptions,
    Table,
    Space,
    Tag,
    Dropdown,
    Menu,
    Modal,
    message,
    Breadcrumb,
    Divider,
    PageHeader,
    Spin,
    Tabs,
    Row,
    Col,
    Statistic
} from 'antd';
import {
    DownOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    PrinterOutlined,
    SaveOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    UserOutlined,
    SettingOutlined,
    FileTextOutlined,
    FileExcelOutlined,
    BarChartOutlined
} from '@ant-design/icons';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { DigitalFormService } from '@/services/digitalFormService';
import FormEntryModal from '@/components/digitalForm/FormEntryModal';
import { DigitalForm, DigitalFormEntry, RecordStatus, ShiftType, STANDARD_TIME_INTERVALS } from '@/types/digitalForm';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const shiftLabels = {
    REGULAR: 'Ca Chính (7:30-16:30)',
    EXTENDED: 'Ca Kéo Dài (16:30-18:00)',
    OVERTIME: 'Ca Tăng Ca (18:00-20:00)',
};

const statusColors = {
    DRAFT: 'blue',
    PENDING: 'orange',
    CONFIRMED: 'green',
    REJECTED: 'red',
};

const DigitalFormDetail: React.FC = () => {
    const router = useRouter();
    const { id } = router.query;
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState<DigitalForm | null>(null);
    const [entries, setEntries] = useState<DigitalFormEntry[]>([]);
    const [isEntryModalVisible, setIsEntryModalVisible] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<DigitalFormEntry | null>(null);
    const [activeTab, setActiveTab] = useState('1');
    const [summaryData, setSummaryData] = useState({
        totalWorkers: 0,
        totalOutput: 0,
        averageOutput: 0,
        entriesWithIssues: 0
    });

    useEffect(() => {
        if (id) {
            fetchFormData();
        }
    }, [id]);

    const fetchFormData = async () => {
        try {
            setLoading(true);
            const response = await DigitalFormService.getFormWithEntries(id as string);

            if (response.success) {
                setForm(response.data.form);
                setEntries(response.data.entries);

                // Calculate summary stats
                const totalWorkers = new Set(response.data.entries.map(entry => entry.userId)).size;
                const totalOutput = response.data.entries.reduce((sum, entry) => sum + entry.totalOutput, 0);
                const averageOutput = totalWorkers > 0 ? Math.round(totalOutput / totalWorkers) : 0;
                const entriesWithIssues = response.data.entries.filter(entry =>
                    entry.issues && entry.issues.length > 0
                ).length;

                setSummaryData({
                    totalWorkers,
                    totalOutput,
                    averageOutput,
                    entriesWithIssues
                });
            } else {
                message.error('Failed to fetch form data');
            }
        } catch (error) {
            console.error('Error fetching form data:', error);
            message.error('An error occurred while fetching form data');
        } finally {
            setLoading(false);
        }
    };

    const handleAddEntry = () => {
        setSelectedEntry(null);
        setIsEntryModalVisible(true);
    };

    const handleEditEntry = (entry: DigitalFormEntry) => {
        setSelectedEntry(entry);
        setIsEntryModalVisible(true);
    };

    const handleDeleteEntry = async (entryId: string) => {
        Modal.confirm({
            title: 'Are you sure you want to delete this entry?',
            content: 'This action cannot be undone.',
            okText: 'Yes, delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    const response = await DigitalFormService.deleteFormEntry(form?.id as string, entryId);

                    if (response.success) {
                        message.success('Entry deleted successfully');
                        fetchFormData();
                    } else {
                        message.error('Failed to delete entry');
                    }
                } catch (error) {
                    console.error('Error deleting entry:', error);
                    message.error('An error occurred while deleting the entry');
                }
            },
        });
    };

    const handleSaveEntry = async (entryData: any) => {
        try {
            let response;

            if (selectedEntry) {
                // Update existing entry
                response = await DigitalFormService.updateFormEntry(
                    form?.id as string,
                    selectedEntry.id,
                    entryData
                );
            } else {
                // Create new entry
                entryData.formId = form?.id;
                response = await DigitalFormService.addFormEntry(form?.id as string, entryData);
            }

            if (response.success) {
                message.success(`Entry ${selectedEntry ? 'updated' : 'added'} successfully`);
                setIsEntryModalVisible(false);
                fetchFormData();
            } else {
                message.error(`Failed to ${selectedEntry ? 'update' : 'add'} entry`);
            }
        } catch (error) {
            console.error(`Error ${selectedEntry ? 'updating' : 'adding'} entry:`, error);
            message.error(`An error occurred while ${selectedEntry ? 'updating' : 'adding'} the entry`);
        }
    };

    const handleSubmitForm = async () => {
        Modal.confirm({
            title: 'Are you sure you want to submit this form?',
            content: 'Once submitted, you cannot edit the form anymore.',
            okText: 'Yes, submit',
            okType: 'primary',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    const response = await DigitalFormService.submitForm(form?.id as string);

                    if (response.success) {
                        message.success('Form submitted successfully');
                        fetchFormData();
                    } else {
                        message.error('Failed to submit form');
                    }
                } catch (error) {
                    console.error('Error submitting form:', error);
                    message.error('An error occurred while submitting the form');
                }
            },
        });
    };

    const handlePrintForm = () => {
        window.open(`/digital-forms/${form?.id}/print`, '_blank');
    };

    const renderTimeIntervalColumns = () => {
        const timeColumns = STANDARD_TIME_INTERVALS.map(interval => ({
            title: interval.label,
            dataIndex: ['hourlyData', interval.label],
            key: interval.label,
            width: 80,
            render: (output: number = 0) => <span>{output}</span>,
        }));

        // Return based on the form's shift type
        if (form?.shiftType === 'REGULAR') {
            return timeColumns.slice(0, 9); // Regular shift columns (7:30-16:30)
        } else if (form?.shiftType === 'EXTENDED') {
            return timeColumns.slice(8, 11); // Extended shift columns (16:30-18:00)
        } else if (form?.shiftType === 'OVERTIME') {
            return timeColumns.slice(10, 13); // Overtime shift columns (18:00-20:00)
        }

        return timeColumns;
    };

    const columns = [
        {
            title: 'Worker',
            dataIndex: 'worker',
            key: 'worker',
            render: (_: any, record: any) => (
                <span>{record.worker?.fullName || 'Unknown'}</span>
            ),
            width: 150,
        },
        {
            title: 'Handbag',
            dataIndex: 'handBag',
            key: 'handBag',
            render: (_: any, record: any) => (
                <span>{record.handBag?.name || 'Unknown'}</span>
            ),
            width: 150,
        },
        {
            title: 'Color',
            dataIndex: 'bagColor',
            key: 'bagColor',
            render: (_: any, record: any) => (
                <span>{record.bagColor?.colorName || 'Unknown'}</span>
            ),
            width: 100,
        },
        {
            title: 'Process',
            dataIndex: 'process',
            key: 'process',
            render: (_: any, record: any) => (
                <span>{record.process?.name || 'Unknown'}</span>
            ),
            width: 150,
        },
        ...renderTimeIntervalColumns(),
        {
            title: 'Total',
            dataIndex: 'totalOutput',
            key: 'totalOutput',
            width: 80,
            render: (total: number) => <span className="total-column">{total}</span>,
        },
        {
            title: 'Actions',
            key: 'actions',
            fixed: 'right',
            width: 120,
            render: (_: any, record: DigitalFormEntry) => (
                form?.status === 'DRAFT' ? (
                    <Space size="small">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => handleEditEntry(record)}
                        />
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteEntry(record.id)}
                        />
                    </Space>
                ) : (
                    <Space size="small">
                        <Button
                            type="text"
                            icon={<FileTextOutlined />}
                            onClick={() => handleEditEntry(record)}
                            disabled={true}
                        />
                    </Space>
                )
            ),
        },
    ];

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!form) {
        return (
            <div style={{ padding: 24 }}>
                <Title level={4}>Form not found</Title>
                <Button onClick={() => router.push('/digital-forms')}>Go back to forms</Button>
            </div>
        );
    }

    const canEdit = form.status === 'DRAFT';
    const isCreator = user?.id === form.createdById;
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
    const canSubmit = canEdit && isCreator && entries.length > 0;
    const canApprove = isAdmin && form.status === 'PENDING';
    const canReject = isAdmin && form.status === 'PENDING';

    return (
        <div className="digital-form-detail-page">
            <Breadcrumb style={{ marginBottom: 16 }}>
                <Breadcrumb.Item>Home</Breadcrumb.Item>
                <Breadcrumb.Item>Production</Breadcrumb.Item>
                <Breadcrumb.Item>
                    <a onClick={() => router.push('/digital-forms')}>Digital Forms</a>
                </Breadcrumb.Item>
                <Breadcrumb.Item>{form.formCode}</Breadcrumb.Item>
            </Breadcrumb>

            <PageHeader
                title={form.formName}
                subTitle={form.formCode}
                tags={<Tag color={statusColors[form.status] || 'default'}>{form.status}</Tag>}
                extra={[
                    canEdit && isCreator && (
                        <Button
                            key="add"
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleAddEntry}
                        >
                            Add Entry
                        </Button>
                    ),
                    canSubmit && (
                        <Button
                            key="submit"
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            onClick={handleSubmitForm}
                        >
                            Submit Form
                        </Button>
                    ),
                    canApprove && (
                        <Button
                            key="approve"
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            onClick={() => DigitalFormService.approveForm(form.id)
                                .then(() => {
                                    message.success('Form approved successfully');
                                    fetchFormData();
                                })
                                .catch(err => {
                                    console.error(err);
                                    message.error('Failed to approve form');
                                })
                            }
                        >
                            Approve
                        </Button>
                    ),
                    canReject && (
                        <Button
                            key="reject"
                            danger
                            icon={<CloseCircleOutlined />}
                            onClick={() => DigitalFormService.rejectForm(form.id)
                                .then(() => {
                                    message.success('Form rejected');
                                    fetchFormData();
                                })
                                .catch(err => {
                                    console.error(err);
                                    message.error('Failed to reject form');
                                })
                            }
                        >
                            Reject
                        </Button>
                    ),
                    <Button
                        key="print"
                        icon={<PrinterOutlined />}
                        onClick={handlePrintForm}
                    >
                        Print
                    </Button>,
                    <Button
                        key="back"
                        onClick={() => router.push('/digital-forms')}
                    >
                        Back
                    </Button>,
                ]}
            />

            <Card style={{ marginBottom: 16 }}>
                <Descriptions bordered size="small" column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}>
                    <Descriptions.Item label="Form Code">{form.formCode}</Descriptions.Item>
                    <Descriptions.Item label="Form Name">{form.formName}</Descriptions.Item>
                    <Descriptions.Item label="Date">{format(new Date(form.date), 'dd/MM/yyyy')}</Descriptions.Item>
                    <Descriptions.Item label="Shift">{shiftLabels[form.shiftType]}</Descriptions.Item>
                    <Descriptions.Item label="Status">
                        <Tag color={statusColors[form.status] || 'default'}>{form.status}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Created By">{form.createdById}</Descriptions.Item>
                    <Descriptions.Item label="Created At">{format(new Date(form.createdAt), 'dd/MM/yyyy HH:mm')}</Descriptions.Item>
                    {form.submitTime && (
                        <Descriptions.Item label="Submitted At">{format(new Date(form.submitTime), 'dd/MM/yyyy HH:mm')}</Descriptions.Item>
                    )}
                    {form.approvedAt && (
                        <Descriptions.Item label="Approved At">{format(new Date(form.approvedAt), 'dd/MM/yyyy HH:mm')}</Descriptions.Item>
                    )}
                </Descriptions>
            </Card>

            <Tabs activeKey={activeTab} onChange={setActiveTab}>
                <TabPane tab="Form Entries" key="1">
                    <Card style={{ marginBottom: 16 }}>
                        <Row gutter={16}>
                            <Col span={6}>
                                <Statistic
                                    title="Total Workers"
                                    value={summaryData.totalWorkers}
                                    prefix={<UserOutlined />}
                                />
                            </Col>
                            <Col span={6}>
                                <Statistic
                                    title="Total Output"
                                    value={summaryData.totalOutput}
                                    prefix={<BarChartOutlined />}
                                />
                            </Col>
                            <Col span={6}>
                                <Statistic
                                    title="Average Output per Worker"
                                    value={summaryData.averageOutput}
                                />
                            </Col>
                            <Col span={6}>
                                <Statistic
                                    title="Entries with Issues"
                                    value={summaryData.entriesWithIssues}
                                    valueStyle={{ color: summaryData.entriesWithIssues > 0 ? '#cf1322' : '#3f8600' }}
                                />
                            </Col>
                        </Row>
                    </Card>

                    <Card>
                        <Table
                            columns={columns}
                            dataSource={entries.map(entry => ({
                                ...entry,
                                key: entry.id,
                                // These would be populated with actual data from your API
                                worker: { fullName: `Worker ${entry.userId.substring(0, 4)}` },
                                handBag: { name: `Bag ${entry.handBagId.substring(0, 4)}` },
                                bagColor: { colorName: `Color ${entry.bagColorId.substring(0, 4)}` },
                                process: { name: `Process ${entry.processId.substring(0, 4)}` }
                            }))}
                            pagination={false}
                            scroll={{ x: 'max-content' }}
                            bordered
                            size="middle"
                            summary={() => (
                                <Table.Summary fixed="bottom">
                                    <Table.Summary.Row>
                                        <Table.Summary.Cell index={0} colSpan={4}>
                                            <strong>Total</strong>
                                        </Table.Summary.Cell>
                                        {renderTimeIntervalColumns().map((col, index) => {
                                            const hourTotal = entries.reduce((sum, entry) => {
                                                return sum + (entry.hourlyData[col.key] || 0);
                                            }, 0);
                                            return (
                                                <Table.Summary.Cell index={index + 4} key={col.key}>
                                                    <strong>{hourTotal}</strong>
                                                </Table.Summary.Cell>
                                            );
                                        })}
                                        <Table.Summary.Cell index={renderTimeIntervalColumns().length + 4}>
                                            <strong>{summaryData.totalOutput}</strong>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={renderTimeIntervalColumns().length + 5} />
                                    </Table.Summary.Row>
                                </Table.Summary>
                            )}
                        />
                    </Card>
                </TabPane>

                <TabPane tab="Issues & Notes" key="2">
                    <Card>
                        <Table
                            columns={[
                                {
                                    title: 'Worker',
                                    dataIndex: 'worker',
                                    key: 'worker',
                                    render: (_: any, record: any) => (
                                        <span>{record.worker?.fullName || 'Unknown'}</span>
                                    ),
                                },
                                {
                                    title: 'Process',
                                    dataIndex: 'process',
                                    key: 'process',
                                    render: (_: any, record: any) => (
                                        <span>{record.process?.name || 'Unknown'}</span>
                                    ),
                                },
                                {
                                    title: 'Issue Type',
                                    dataIndex: 'issueType',
                                    key: 'issueType',
                                    render: (_: any, record: any) => (
                                        <span>{record.issueType}</span>
                                    ),
                                },
                                {
                                    title: 'Hour',
                                    dataIndex: 'hour',
                                    key: 'hour',
                                },
                                {
                                    title: 'Impact',
                                    dataIndex: 'impact',
                                    key: 'impact',
                                    render: (impact: number) => `${impact}%`,
                                },
                                {
                                    title: 'Description',
                                    dataIndex: 'description',
                                    key: 'description',
                                },
                            ]}
                            dataSource={entries
                                .filter(entry => entry.issues && entry.issues.length > 0)
                                .flatMap(entry =>
                                    (entry.issues || []).map((issue, index) => ({
                                        key: `${entry.id}-${index}`,
                                        worker: { fullName: `Worker ${entry.userId.substring(0, 4)}` },
                                        process: { name: `Process ${entry.processId.substring(0, 4)}` },
                                        ...issue,
                                    }))
                                )}
                            pagination={false}
                            bordered
                            size="middle"
                        />
                    </Card>
                </TabPane>

                {/* Additional tabs can be added here for analytics, history, etc. */}
            </Tabs>

            <FormEntryModal
                visible={isEntryModalVisible}
                onCancel={() => setIsEntryModalVisible(false)}
                onSave={handleSaveEntry}
                entry={selectedEntry}
                formId={form.id}
                shiftType={form.shiftType}
            />
        </div>
    );
}