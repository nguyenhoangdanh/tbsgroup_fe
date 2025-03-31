import React from 'react';
import { NextPage } from 'next';
import { Layout, Breadcrumb } from 'antd';
import { HomeOutlined, SettingOutlined } from '@ant-design/icons';
import Link from 'next/link';
import EditBagRates from '../../../components/bag-group-rates/EditBagRates';
import withAuth from '../../../components/auth/withAuth';

const { Content } = Layout;

const EditBagRatesPage: NextPage = () => {
    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Layout className="site-layout">
                <Content style={{ margin: '0 16px' }}>
                    <Breadcrumb style={{ margin: '16px 0' }}>
                        <Breadcrumb.Item>
                            <Link href="/dashboard">
                                <a><HomeOutlined /> Trang chủ</a>
                            </Link>
                        </Breadcrumb.Item>
                        <Breadcrumb.Item>
                            <Link href="/bag-group-rates">
                                <a><SettingOutlined /> Năng suất túi theo nhóm</a>
                            </Link>
                        </Breadcrumb.Item>
                        <Breadcrumb.Item>Chỉnh sửa</Breadcrumb.Item>
                    </Breadcrumb>
                    <div className="site-layout-background" style={{ padding: 24, minHeight: 360 }}>
                        <EditBagRates />
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
};

export default withAuth(EditBagRatesPage);