import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
    Button,
    Card,
    Typography,
    Table,
    Space,
    Tag,
    Input,
    DatePicker,
    Select,
    Modal,
    message,
    Breadcrumb,
    Divider,
    PageHeader
} from 'antd';
import {
    PlusOutlined,
    SearchOutlined,
    EditOutlined,
    DeleteOutlined,
    PrinterOutlined,
    FileAddOutlined,
    CheckOutlined,
    CloseOutlined
} from '@ant-design/icons';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { DigitalFormService } from '@/services/digitalFormService';
import CreateFormModal from '@/components/digitalForm/CreateFormModal';
import { DigitalForm, RecordStatus, ShiftType } from '@/types/digitalForm';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const statusColors = {
    DRAFT: 'blue',
    PENDING: 'orange',
    CONFIRMED: 'green',
    REJECTED: 'red',
};

const shiftLabels = {
    REGULAR: 'Ca Chính (7:30-16:30)',
    EXTENDED: 'Ca Kéo Dài (16:30-18:00)',
    OVERTIME: 'Ca Tăng Ca (18:00-20:00)',
};

const DigitalFormPage: React.FC = () => {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [forms, setForms] = useState<DigitalForm[]>([]);
    const [totalForms, setTotalForms] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [shiftFilter, setShiftFilter] = useState<string | null>(null);

    useEffect(() => {
        fetchForms();
    }, [currentPage, pageSize, searchQuery, dateRange, statusFilter, shiftFilter]);

    const fetchForms = async () => {
        try {
            setLoading(true);

            // Build the query parameters
            const params: any = {
                page: currentPage,
                limit: pageSize,
                sortBy: 'createdAt',
                sortOrder: 'desc',
            };

            // Add filters if they are set
            if (searchQuery) {
                params.search = searchQuery;
            }

            if (dateRange[0] && dateRange[1]) {
                params.dateFrom = format(dateRange[0], 'yyyy-MM-dd');
                params.dateTo = format(dateRange[1], 'yyyy-MM-dd');
            }

            if (statusFilter) {
                params.status = statusFilter;
            }

            if (shiftFilter) {
                params.shiftType = shiftFilter;
            }

            // User-specific filter
            if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
                params.createdById = user?.id;
            }

            const response = await DigitalFormService.listForms(params);

            if (response.success) {
                setForms(response.data);
                setTotalForms(response.total);
            } else {
                message.error('Failed to fetch forms');
            }
        } catch (error) {
            console.error('Error fetching forms:', error);
            message.error('An error occurred while fetching forms');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateForm = async (formData: any) => {
        try {
            const response = await DigitalFormService.createForm(formData);

            if (response.success) {
                message.success('Form created successfully');
                setIsCreateModalVisible(false);
                fetchForms();

                // Navigate to form detail page
                router.push(`/digital-forms/${response.data.id}`);
            } else {
                message.error('Failed to create form');
            }
        } catch (error) {
            console.error('Error creating form:', error);
            message.error('An error occurred while creating the form');
        }
    };

    const handleEditForm = (id: string) => {
        router.push(`/digital-forms/${id}`);
    };

    const handleDeleteForm = async (id: string) => {
        Modal.confirm({
            title: 'Are you sure you want to delete this form?',
            content: 'This action cannot be undone.',
            okText: 'Yes, delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    const response = await DigitalFormService.deleteForm(id);

                    if (response.success) {
                        message.success('Form deleted successfully');
                        fetchForms();
                    } else {
                        message.error('Failed to delete form');
                    }
                } catch (error) {
                    console.error('Error deleting form:', error);
                    message.error('An error occurred while deleting the form');
                }
            },
        });
    };

    const handleViewForm = (id: string) => {
        router.push(`/digital-forms/${id}`);
    };

    const handlePrintForm = (id: string) => {
        window.open(`/digital-forms/${id}/print`, '_blank');
    };

    const columns = [
        {
            title: 'Form Code',
            dataIndex: 'formCode',
            key: 'formCode',
            render: (text: string, record: DigitalForm) => (
                <a onClick={() => handleViewForm(record.id)}>{text}</a>
            ),
        },
        {
            title: 'Form Name',
            dataIndex: 'formName',
            key: 'formName',
        },
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (date: string) => format(new Date(date), 'dd/MM/yyyy'),
        },
        {
            title: 'Shift',
            dataIndex: 'shiftType',
            key: 'shiftType',
            render: (shiftType: ShiftType) => (
                <span>{shiftLabels[shiftType]}</span>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: RecordStatus) => (
                <Tag color={statusColors[status] || 'default'}>
                    {status}
                </Tag>
            ),
        },
        {
            title: 'Created At',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => format(new Date(date), 'dd/MM/yyyy HH:mm'),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: DigitalForm) => (
                <Space size="small">
                    {record.status === 'DRAFT' && (
                        <>
                            <Button
                                type="primary"
                                icon={<EditOutlined />}
                                size="small"
                                onClick={() => handleEditForm(record.id)}
                            >
                                Edit
                            </Button>
                            <Button
                                danger
                                icon={<DeleteOutlined />}
                                size="small"
                                onClick={() => handleDeleteForm(record.id)}
                            >
                                Delete
                            </Button>
                        </>
                    )}
                    <Button
                        icon={<PrinterOutlined />}
                        size="small"
                        onClick={() => handlePrintForm(record.id)}
                    >
                        Print
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div className="digital-form-page">
            <Breadcrumb style={{ marginBottom: 16 }}>
                <Breadcrumb.Item>Home</Breadcrumb.Item>
                <Breadcrumb.Item>Production</Breadcrumb.Item>
                <Breadcrumb.Item>Digital Forms</Breadcrumb.Item>
            </Breadcrumb>

            <PageHeader
                title="Digital Production Forms"
                subTitle="Manage production process forms"
                extra={[
                    <Button
                        key="1"
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setIsCreateModalVisible(true)}
                    >
                        Create New Form
                    </Button>,
                ]}
            />

            <Card className="form-filter-card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
                    <Input
                        placeholder="Search by form code or name"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: 250 }}
                        prefix={<SearchOutlined />}
                        allowClear
                    />
                    <RangePicker
                        onChange={(dates) => {
                            if (dates) {
                                setDateRange([dates[0]?.toDate() || null, dates[1]?.toDate() || null]);
                            } else {
                                setDateRange([null, null]);
                            }
                        }}
                    />
                    <Select
                        placeholder="Filter by status"
                        style={{ width: 180 }}
                        onChange={(value) => setStatusFilter(value)}
                        value={statusFilter}
                        allowClear
                    >
                        <Option value="DRAFT">Draft</Option>
                        <Option value="PENDING">Pending</Option>
                        <Option value="CONFIRMED">Confirmed</Option>
                        <Option value="REJECTED">Rejected</Option>
                    </Select>
                    <Select
                        placeholder="Filter by shift"
                        style={{ width: 180 }}
                        onChange={(value) => setShiftFilter(value)}
                        value={shiftFilter}
                        allowClear
                    >
                        <Option value="REGULAR">Regular (7:30-16:30)</Option>
                        <Option value="EXTENDED">Extended (16:30-18:00)</Option>
                        <Option value="OVERTIME">Overtime (18:00-20:00)</Option>
                    </Select>
                    <Button
                        onClick={() => {
                            setSearchQuery('');
                            setDateRange([null, null]);
                            setStatusFilter(null);
                            setShiftFilter(null);
                        }}
                    >
                        Reset Filters
                    </Button>
                </div>
            </Card>

            <Card>
                <Table
                    columns={columns}
                    dataSource={forms}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: currentPage,
                        pageSize,
                        total: totalForms,
                        onChange: (page, pageSize) => {
                            setCurrentPage(page);
                            setPageSize(pageSize);
                        },
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} items`,
                    }}
                />
            </Card>

            <CreateFormModal
                visible={isCreateModalVisible}
                onCancel={() => setIsCreateModalVisible(false)}
                onCreate={handleCreateForm}
            />
        </div>
    );
};

export default DigitalFormPage;