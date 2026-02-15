Class SpectraSight.Model.Ticket Extends (%Persistent, %JSON.Adaptor)
{

Property Title As %String(%JSONFIELDNAME = "title", MAXLEN = 500);

Property Description As %String(%JSONFIELDNAME = "description", MAXLEN = 32000);

Property Status As %String(%JSONFIELDNAME = "status", VALUELIST = ",Open,In Progress,Blocked,Complete") [ InitialExpression = "Open" ];

Property Priority As %String(%JSONFIELDNAME = "priority", VALUELIST = ",Low,Medium,High,Critical");

Property Assignee As %String(%JSONFIELDNAME = "assignee", MAXLEN = 255);

Property Parent As SpectraSight.Model.Ticket(%JSONFIELDNAME = "parentId");

Property CreatedAt As %TimeStamp(%JSONFIELDNAME = "createdAt");

Property UpdatedAt As %TimeStamp(%JSONFIELDNAME = "updatedAt");

Index StatusIdx On Status;

Index AssigneeIdx On Assignee;

Index ParentIdx On Parent;

Method %OnNew(initvalue As %String = "") As %Status
{
    Set tSC = $$$OK
    Try {
        Set ..CreatedAt = $ZDATETIME($ZTIMESTAMP, 3, 1)
        Set ..UpdatedAt = ..CreatedAt
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

Method %OnBeforeSave(insert As %Boolean) As %Status
{
    Set tSC = $$$OK
    Try {
        Set ..UpdatedAt = $ZDATETIME($ZTIMESTAMP, 3, 1)
    }
    Catch ex {
        Set tSC = ex.AsStatus()
    }
    Quit tSC
}

Storage Default
{
<Data name="TicketDefaultData">
<Value name="1">
<Value>%%CLASSNAME</Value>
</Value>
<Value name="2">
<Value>Title</Value>
</Value>
<Value name="3">
<Value>Description</Value>
</Value>
<Value name="4">
<Value>Status</Value>
</Value>
<Value name="5">
<Value>Priority</Value>
</Value>
<Value name="6">
<Value>Assignee</Value>
</Value>
<Value name="7">
<Value>Parent</Value>
</Value>
<Value name="8">
<Value>CreatedAt</Value>
</Value>
<Value name="9">
<Value>UpdatedAt</Value>
</Value>
</Data>
<DataLocation>^SpectraSight.Model.TicketD</DataLocation>
<DefaultData>TicketDefaultData</DefaultData>
<IdLocation>^SpectraSight.Model.TicketD</IdLocation>
<IndexLocation>^SpectraSight.Model.TicketI</IndexLocation>
<StreamLocation>^SpectraSight.Model.TicketS</StreamLocation>
<Type>%Storage.Persistent</Type>
}

}
