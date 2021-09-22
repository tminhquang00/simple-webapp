import React, {useState} from 'react';
import 'antd/dist/antd.css';

import './App.css';
import {
  Table,
  Input,
  InputNumber,
  Popconfirm,
  Form,
  Typography,
  Row,
  Col,
  Empty,
} from 'antd';
const {Search} = Input;

const EditableCell = ({
  editing,
  dataIndex,
  title,
  inputType,
  record,
  index,
  children,
  ...restProps
}) => {
  const inputNode = inputType === 'number' ? <InputNumber /> : <Input />;
  return (
    <td {...restProps}>
      {editing
        ? <Form.Item
            name={dataIndex}
            style={{
              margin: 0,
            }}
            rules={[
              {
                required: true,
                message: `Please Input ${title}!`,
              },
            ]}
          >
            {inputNode}
          </Form.Item>
        : children}
    </td>
  );
};

function App () {
  const [isLoading, setIsLoading] = useState (false);
  const [data, setData] = useState (null);
  const [form] = Form.useForm ();
  const [editingKey, setEditingKey] = useState ('');

  const isEditing = record => record.id === editingKey;

  const edit = record => {
    form.setFieldsValue ({
      name: '',
      age: '',
      address: '',
      ...record,
    });
    setEditingKey (record.id);
  };

  const cancel = () => {
    setEditingKey ('');
  };

  const save = async id => {
    try {
      const row = await form.validateFields ();
      const newData = [...data];
      const index = newData.findIndex (item => id === item.id);
      console.log (index);

      if (index > -1) {
        const item = newData[index];
        newData.splice (index, 1, {...item, ...row});
        setData (newData);

        // POST request using fetch with async/await
        const requestOptions = {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify (newData),
        };
        const response = await fetch (`/api/update`, requestOptions);
        const message = await response.json ();
        alert (message.message);
        setEditingKey ('');
      } else {
        newData.push (row);
        setData (newData);
        setEditingKey ('');
      }
    } catch (errInfo) {
      console.log ('Validate Failed:', errInfo);
    }
  };

  const columns = [
    {
      title: 'User ID',
      dataIndex: 'id',
      key: 'id',
      editable: false,
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      editable: true,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      editable: true,
    },
    {
      title: 'Date of Birth',
      dataIndex: 'birthdate',
      key: 'birthdate',
      editable: true,
    },
    {
      title: 'operation',
      dataIndex: 'operation',
      render: (_, record) => {
        const editable = isEditing (record);
        return editable
          ? <span>
              <a
                href="javascript:;"
                onClick={() => save (record.id)}
                style={{
                  marginRight: 8,
                }}
              >
                Save
              </a>
              <Popconfirm title="Sure to cancel?" onConfirm={cancel}>
                <a>Cancel</a>
              </Popconfirm>
            </span>
          : <Typography.Link
              disabled={editingKey !== ''}
              onClick={() => edit (record)}
            >
              Edit
            </Typography.Link>;
      },
    },
  ];
  const mergedColumns = columns.map (col => {
    if (!col.editable) {
      return col;
    }

    return {
      ...col,
      onCell: record => ({
        record,
        inputType: col.dataIndex === 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing (record),
      }),
    };
  });

  // we will use async/await to fetch this data
  async function getData (value) {
    setIsLoading (true);
    const res = await fetch (`/api/users?name=` + value);
    const data = await res.json ();

    // store the data into our books variable
    setData (data.result);
    setIsLoading (false);
  }

  const onSearch = value => {
    getData (value);
    console.log (data);
  };

  return (
    <div className="App">
      <Row align="center">
        <Col span={5}>
          <Search
            placeholder="input search text"
            allowClear
            onSearch={onSearch}
            enterButton
            style={{marginBottom: 20}}
          />
        </Col>
      </Row>
      <Row align="center">
        <Col span={15}>

          {data !== null && data.length > 0 && isLoading === false
            ? <Form form={form} component={false}>
                <Table
                  components={{
                    body: {
                      cell: EditableCell,
                    },
                  }}
                  bordered
                  dataSource={data}
                  columns={mergedColumns}
                  rowClassName="editable-row"
                  pagination={{
                    onChange: cancel,
                  }}
                />
              </Form>
            : <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={<span>No user to display</span>}
              />}
        </Col>
      </Row>

    </div>
  );
}

export default App;
