import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Toast } from 'antd-mobile';
import { useAuthStore } from '@/stores';
import './index.css';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, register } = useAuthStore();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    const usernameEl = document.querySelector('.login-username input') as HTMLInputElement;
    const passwordEl = document.querySelector('.login-password input') as HTMLInputElement;
    const confirmEl = document.querySelector('.login-confirm input') as HTMLInputElement;

    const username = usernameEl?.value?.trim() ?? '';
    const password = passwordEl?.value ?? '';
    const confirm = isRegister ? (confirmEl?.value ?? '') : '';

    // 表单验证
    if (!username) {
      Toast.show({ content: '请输入账号', icon: 'fail' });
      return;
    }
    if (username.length < 2) {
      Toast.show({ content: '账号至少2个字符', icon: 'fail' });
      return;
    }
    if (!password) {
      Toast.show({ content: '请输入密码', icon: 'fail' });
      return;
    }
    if (password.length < 4) {
      Toast.show({ content: '密码至少4位', icon: 'fail' });
      return;
    }
    if (isRegister && password !== confirm) {
      Toast.show({ content: '两次密码不一致', icon: 'fail' });
      return;
    }

    setLoading(true);

    // 模拟网络延迟
    await new Promise((r) => setTimeout(r, 600));

    const success = isRegister
      ? register(username, password)
      : login(username, password);

    setLoading(false);

    if (success) {
      Toast.show({ content: isRegister ? '注册成功' : '登录成功', icon: 'success' });
      // 延迟跳转，等 Toast 显示
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 500);
    } else {
      if (isRegister) {
        Toast.show({ content: '该账号已被注册', icon: 'fail' });
      } else {
        Toast.show({ content: '账号或密码错误', icon: 'fail' });
      }
    }
  }, [isRegister, login, register, navigate]);

  const switchMode = useCallback(() => {
    setIsRegister((prev) => !prev);
  }, []);

  return (
    <div className="login-page">
      {/* 顶部装饰区域 */}
      <div className="login-header">
        <div className="login-logo">
          <div className="login-logo-icon">$</div>
        </div>
        <h1 className="login-title">记账本</h1>
        <p className="login-subtitle">
          {isRegister ? '创建新账号' : '欢迎回来'}
        </p>
      </div>

      {/* 表单区域 */}
      <div className="login-form">
        <Form
          layout="vertical"
          footer={
            <Button
              block
              color="primary"
              size="large"
              loading={loading}
              onClick={handleSubmit}
              style={{
                '--background-color': '#1677ff',
                '--border-color': '#1677ff',
                '--text-color': '#fff',
                borderRadius: '24px',
                height: '48px',
                fontSize: '16px',
                fontWeight: 600,
              } as React.CSSProperties}
            >
              {isRegister ? '注 册' : '登 录'}
            </Button>
          }
        >
          <Form.Item label="账号" className="login-username">
            <Input
              placeholder="请输入账号"
              clearable
              maxLength={20}
              autoComplete="username"
            />
          </Form.Item>
          <Form.Item label="密码" className="login-password">
            <Input
              placeholder="请输入密码"
              clearable
              type="password"
              maxLength={32}
              autoComplete={
                isRegister ? 'new-password' : 'current-password'
              }
            />
          </Form.Item>
          {isRegister && (
            <Form.Item label="确认密码" className="login-confirm">
              <Input
                placeholder="请再次输入密码"
                clearable
                type="password"
                maxLength={32}
                autoComplete="new-password"
              />
            </Form.Item>
          )}
        </Form>

        {/* 切换登录/注册 */}
        <div className="login-switch">
          <span className="login-switch-text">
            {isRegister ? '已有账号？' : '还没有账号？'}
          </span>
          <span className="login-switch-link" onClick={switchMode}>
            {isRegister ? '去登录' : '立即注册'}
          </span>
        </div>
      </div>

      {/* 底部信息 */}
      <div className="login-footer">
        <p>首次使用？任意账号密码即可登录</p>
      </div>
    </div>
  );
};

export default LoginPage;
